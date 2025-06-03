from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import nltk
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from bertopic import BERTopic
import google.generativeai as genai
import PyPDF2
import asyncpg
import uuid
import os
import json
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, List

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DATAVASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Download NLTK resources
try:
    nltk.download('punkt_tab', quiet=True)
    nltk.download('punkt', quiet=True)
except Exception as e:
    raise Exception(f"Failed to download NLTK resources: {str(e)}")

# Initialize Gemini API
try:
    genai.configure(api_key=GEMINI_API_KEY)
except Exception as e:
    raise Exception(f"Failed to configure Gemini API: {str(e)}")

# Initialize SentenceTransformer
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# OAuth2 scheme for JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Database connection pool
async def init_db():
    try:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        return pool
    except Exception as e:
        raise Exception(f"Failed to connect to database: {str(e)}")

@app.on_event("startup")
async def startup():
    global pool
    pool = await init_db()

@app.on_event("shutdown")
async def shutdown():
    global pool
    await pool.close()

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ConceptMapRequest(BaseModel):
    topic_id: Optional[int] = None

class QueryRequest(BaseModel):
    question: str

class FlashcardRequest(BaseModel):
    num_flashcards: int = 10

class Flashcard(BaseModel):
    flashcard_id: str
    question: str
    answer: str
    created_at: datetime

# JWT authentication
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# Chunking function for PDF text extraction
def extract_text_chunks(reader: PyPDF2.PdfReader, max_chunk_size: int = 500) -> List[str]:
    """
    Extract text from PDF in chunks (e.g., paragraphs or sentences) for better accuracy.
    max_chunk_size: Maximum characters per chunk.
    """
    chunks = []
    for page in reader.pages:
        text = page.extract_text() or ""
        # Split into paragraphs
        paragraphs = text.split("\n\n")
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            # Further split long paragraphs into sentences
            sentences = nltk.sent_tokenize(para)
            current_chunk = ""
            for sentence in sentences:
                if len(current_chunk) + len(sentence) <= max_chunk_size:
                    current_chunk += sentence + " "
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + " "
            if current_chunk:
                chunks.append(current_chunk.strip())
    return chunks

# User APIs
@app.post("/register")
async def register_user(user: UserCreate):
    try:
        password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        async with pool.acquire() as conn:
            try:
                user_id = uuid.uuid4()
                await conn.execute(
                    "INSERT INTO users(user_id, username, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)",
                    user_id, user.username, user.email, password_hash, datetime.utcnow()
                )
                return {"message": "User registered successfully", "user_id": str(user_id)}
            except asyncpg.UniqueViolationError:
                raise HTTPException(status_code=400, detail="Username or email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register user: {str(e)}")

@app.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        async with pool.acquire() as conn:
            user = await conn.fetchrow(
                "SELECT user_id, password_hash FROM users WHERE username = $1", form_data.username
            )
            if not user or not bcrypt.checkpw(form_data.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                raise HTTPException(status_code=401, detail="Invalid username or password")
            access_token = create_access_token(data={"sub": str(user['user_id'])})
            return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to login: {str(e)}")

# Document APIs
@app.post("/upload")
async def upload_document(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files can be uploaded")
    try:
        async with pool.acquire() as conn:
            existing_document = await conn.fetchrow(
                "SELECT id FROM document WHERE user_id = $1 AND title = $2", uuid.UUID(user_id), file.filename
            )
            if existing_document:
                raise HTTPException(status_code=400, detail="A file with this name already exists")

            reader = PyPDF2.PdfReader(file.file)
            chunks = extract_text_chunks(reader)
            if not chunks:
                raise HTTPException(status_code=400, detail="No content extracted from PDF")

            content = "\n".join(chunks)
            embedding = embedder.encode(content).tolist()
            embedding_str = str(embedding)

            doc_id = uuid.uuid4()
            await conn.execute(
                "INSERT INTO document(id, user_id, title, content, embedding, created_at) "
                "VALUES ($1, $2, $3, $4, $5, $6)",
                doc_id, uuid.UUID(user_id), file.filename, content, embedding_str, datetime.utcnow()
            )
            return {"id": str(doc_id)}  # Updated return key
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process document: {str(e)}")

        raise HTTPException(status_code=500, detail=f"Failed to generate concept map: {str(e)}")


@app.post("/query")
async def query_document(query: QueryRequest, user_id: str = Depends(get_current_user)):
    try:
        query_embedding = embedder.encode(query.question).tolist()
        query_embedding_str = str(query_embedding)

        async with pool.acquire() as conn:
            # 1. Fetch similar documents
            rows = await conn.fetch(
                "SELECT id, title, content FROM document WHERE user_id = $1 ORDER BY embedding <=> $2::vector LIMIT 3",
                uuid.UUID(user_id), query_embedding_str
            )

            # 2. Prepare prompt
            context = "\n".join([f"Document: {row['title']}\nContent: {row['content']}" for row in rows])
            prompt = (
                "You are a helpful assistant answering questions based solely on the provided document content. "
                "Do not use any external knowledge or make assumptions beyond the given context. "
                "If the context does not contain enough information to answer the question, respond with: "
                "\"The provided documents do not contain enough information to answer this question.\" "
                f"\n\nDocument content:\n{context}\n\nQuestion: {query.question}"
            )
            response = genai.GenerativeModel("gemini-1.5-flash").generate_content(prompt)

            # 3. Insert query into DB (inside the same `with` block)
            query_id = uuid.uuid4()
            document_id = rows[0]['id'] if rows else None
            if document_id:
                await conn.execute(
                    "INSERT INTO queries(query_id, user_id, id, question, response) "
                    "VALUES ($1, $2, $3, $4, $5)",
                    query_id, uuid.UUID(user_id), document_id, query.question, response.text)

        # 4. Return result (outside the block)
        documents = [
            {"id": str(row["id"]), "title": row["title"], "content": row["content"][:2000]}
            for row in rows
        ]
        return {
            "query_id": str(query_id),
            "answer": response.text,
            "documents": documents,
            "context_available": len(documents) > 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")
# Flashcard APIs
@app.post("/flashcards/{id}")  # Updated route parameter
async def generate_flashcards(id: str, request: FlashcardRequest = Depends(), user_id: str = Depends(get_current_user)):
    try:
        # Validate num_flashcards
        num_flashcards = min(max(request.num_flashcards, 1), 20)  # Cap between 1 and 20
        async with pool.acquire() as conn:
            document = await conn.fetchrow(
                "SELECT content, title FROM document WHERE id = $1 AND user_id = $2",
                uuid.UUID(id), uuid.UUID(user_id)
            )
            if not document:
                raise HTTPException(status_code=404, detail="Document not found or not owned by user")

            if not document['content']:
                raise HTTPException(status_code=400, detail="No content available for this document")

            # Chunk content for processing
            chunks = nltk.sent_tokenize(document['content'])
            if not chunks:
                raise HTTPException(status_code=400, detail="No sentences available to generate flashcards")

            content_to_process = "\n".join(chunks)[:16000]  # Gemini context limit
            prompt = (
                f"You are an expert in creating educational flashcards. Given the following document content, "
                f"generate exactly {num_flashcards} flashcard question-answer pairs. Each flashcard should have a 'question' and 'answer' field. "
                "Focus on key concepts, definitions, processes, or facts suitable for studying. Ensure questions are clear, concise, and varied (e.g., definitions, processes, examples). "
                "If insufficient content exists to generate the requested number, generate as many as possible and note the limitation in the response. "
                "Return a JSON array of objects with 'question' and 'answer' fields."
                f"\n\nDocument Content:\n{content_to_process}"
            )
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)

            try:
                flashcards = json.loads(response.text.strip("```json\n```"))
                if not isinstance(flashcards, list):
                    raise ValueError("Expected a list of flashcards")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to parse flashcard response: {str(e)}")

            # Store flashcards in database
            flashcard_ids = []
            for card in flashcards:
                flashcard_id = uuid.uuid4()
                await conn.execute(
                    "INSERT INTO flashcards(flashcard_id, user_id, document_id, question, answer, created_at) "
                    "VALUES ($1, $2, $3, $4, $5, $6)",
                    flashcard_id, uuid.UUID(user_id), uuid.UUID(id), card['question'], card['answer'], datetime.utcnow()
                )
                flashcard_ids.append(str(flashcard_id))

            # Prepare response
            message = f"Generated {len(flashcards)} flashcards for {document['title']}"
            if len(flashcards) < num_flashcards:
                message += f". Requested {num_flashcards}, but only {len(flashcards)} could be generated due to limited content."

            return {
                "id": id,  # Updated key
                "flashcards": [
                    {
                        "flashcard_id": fid,
                        "question": card['question'],
                        "answer": card['answer'],
                        "created_at": datetime.utcnow().isoformat()
                    }
                    for fid, card in zip(flashcard_ids, flashcards)
                ],
                "message": message
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")

@app.get("/flashcards/{id}", response_model=List[Flashcard])  # Updated route parameter
async def get_flashcards(id: str, user_id: str = Depends(get_current_user)):
    try:
        async with pool.acquire() as conn:
            flashcards = await conn.fetch(
                "SELECT flashcard_id, question, answer, created_at FROM flashcards WHERE id = $1 AND user_id = $2 ORDER BY created_at",
                uuid.UUID(id), uuid.UUID(user_id)
            )
            if not flashcards:
                raise HTTPException(status_code=404, detail="No flashcards found for this document")

            return [
                {
                    "flashcard_id": str(row['flashcard_id']),
                    "question": row['question'],
                    "answer": row['answer'],
                    "created_at": row['created_at']
                }
                for row in flashcards
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve flashcards: {str(e)}")