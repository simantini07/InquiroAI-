from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import nltk
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from bertopic import BERTopic
from contextlib import asynccontextmanager
import google.generativeai as genai
import PyPDF2
from dotenv import load_dotenv
import asyncpg
import uuid
import os
import json
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, List

# Type hint for the connection pool
pool: Optional[asyncpg.Pool] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await init_db()  # Startup
    yield
    if pool:
        await pool.close()      # Shutdown

# Initialize FastAPI app
app = FastAPI(lifespan=lifespan)
load_dotenv()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

print(f"DATABASE_URL from env: {os.getenv('DATABASE_URL')}")

# Download NLTK resources
try:
    nltk.download('punkt_tab', quiet=True)
    nltk.download('punkt', quiet=True)
except Exception as e:
    raise Exception(f"Failed to download NLTK resources: {str(e)}")

# Initialize Gemini API
try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
    else:
        raise Exception("GEMINI_API_KEY not found in environment variables")
except Exception as e:
    raise Exception(f"Failed to configure Gemini API: {str(e)}")

# Initialize SentenceTransformer
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# OAuth2 scheme for JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Database connection pool
async def init_db() -> asyncpg.Pool:
    try:
        if not DATABASE_URL:
            raise Exception("DATABASE_URL not found in environment variables")
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        return pool
    except Exception as e:
        raise Exception(f"Failed to connect to database: {str(e)}")

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

class DocumentResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    file_size: Optional[int] = None
    content_preview: Optional[str] = None

class FlashcardRequest(BaseModel):
    num_flashcards: int = 10

class Flashcard(BaseModel):
    flashcard_id: str
    question: str
    answer: str
    created_at: datetime

# JWT authentication
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET not configured")
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    try:
        if not JWT_SECRET:
            raise HTTPException(status_code=500, detail="JWT_SECRET not configured")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def extract_text_chunks(reader: PyPDF2.PdfReader, max_chunk_size: int = 500) -> List[str]:
    """
    Extract text from PDF in chunks with better error handling and debugging.
    """
    chunks = []
    total_text = ""
    
    try:
        # Debug: Check if PDF is encrypted
        if reader.is_encrypted:
            raise Exception("PDF is password-protected. Please provide an unencrypted version.")
        
        # Extract text from all pages
        for page_num, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text and text.strip():
                    total_text += text + "\n"
                    print(f"Page {page_num + 1}: Extracted {len(text)} characters")
                else:
                    print(f"Page {page_num + 1}: No text found (possibly scanned/image-based)")
            except Exception as page_error:
                print(f"Error extracting from page {page_num + 1}: {str(page_error)}")
                continue
        
        # Debug: Print total extracted text length
        print(f"Total text extracted: {len(total_text)} characters")
        
        if not total_text.strip():
            raise Exception("No text content found. This might be a scanned PDF or image-based PDF that requires OCR.")
        
        # Process the extracted text into chunks
        # Split by double newlines (paragraphs) first
        paragraphs = total_text.split("\n\n")
        
        for para in paragraphs:
            para = para.strip()
            if len(para) < 10:  # Skip very short paragraphs
                continue
                
            # Clean up the paragraph
            para = " ".join(para.split())  # Normalize whitespace
            
            # If paragraph is short enough, add as single chunk
            if len(para) <= max_chunk_size:
                chunks.append(para)
            else:
                # Split long paragraphs into sentences
                try:
                    sentences = nltk.sent_tokenize(para)
                    current_chunk = ""
                    
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 1 <= max_chunk_size:
                            current_chunk += sentence + " "
                        else:
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence + " "
                    
                    if current_chunk.strip():
                        chunks.append(current_chunk.strip())
                        
                except Exception as nltk_error:
                    # Fallback: split by periods if NLTK fails
                    sentences = para.split('. ')
                    current_chunk = ""
                    
                    for sentence in sentences:
                        if not sentence.endswith('.'):
                            sentence += '.'
                        if len(current_chunk) + len(sentence) + 1 <= max_chunk_size:
                            current_chunk += sentence + " "
                        else:
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence + " "
                    
                    if current_chunk.strip():
                        chunks.append(current_chunk.strip())
    
    except Exception as e:
        print(f"Error in extract_text_chunks: {str(e)}")
        raise
    
    # Filter out chunks that are too short or contain mostly non-alphabetic characters
    filtered_chunks = []
    for chunk in chunks:
        # Check if chunk has sufficient alphabetic content
        alpha_chars = sum(1 for c in chunk if c.isalpha())
        if len(chunk) >= 20 and alpha_chars / len(chunk) > 0.5:
            filtered_chunks.append(chunk)
    
    print(f"Final chunks: {len(filtered_chunks)} chunks created")
    return filtered_chunks


# User APIs
@app.post("/register")
async def register_user(user: UserCreate):
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
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
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
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
# Updated upload endpoint with better error messages

@app.post("/upload")
async def upload_document(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    # Check if filename exists and is a PDF
    if not file.filename or not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files can be uploaded")
    
    try:
        async with pool.acquire() as conn:
            existing_document = await conn.fetchrow(
                "SELECT id FROM document WHERE user_id = $1 AND title = $2",
                uuid.UUID(user_id), file.filename
            )
            if existing_document:
                raise HTTPException(status_code=400, detail="A file with this name already exists")

            # Reset file pointer to beginning
            await file.seek(0)

            # Create PDF reader
            try:
                reader = PyPDF2.PdfReader(file.file)
                print(f"PDF loaded successfully. Pages: {len(reader.pages)}")
            except Exception as pdf_error:
                print(f"PDF reading error: {str(pdf_error)}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to read PDF file. The file may be corrupted. Error: {str(pdf_error)}"
                )

            # Extract text chunks
            try:
                chunks = extract_text_chunks(reader)
            except Exception as chunk_error:
                print(f"Text extraction error: {str(chunk_error)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to extract text: {str(chunk_error)}"
                )

            if not chunks:
                raise HTTPException(
                    status_code=400, 
                    detail="No readable text content found in the PDF. This might be a scanned document or image-based PDF."
                )

            content = "\n".join(chunks)
            
            if len(content.strip()) < 100:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient content extracted ({len(content)} characters). Please ensure the PDF contains substantial readable text."
                )

            print(f"Successfully extracted {len(content)} characters from PDF")

            # Generate embedding
            try:
                embedding = embedder.encode(content).tolist()
                embedding_str = str(embedding)
            except Exception as embed_error:
                print(f"Embedding generation error: {str(embed_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate embedding: {str(embed_error)}"
                )

            # Save to database
            try:
                doc_id = uuid.uuid4()
                await conn.execute(
                    "INSERT INTO document(id, user_id, title, content, embedding, created_at) "
                    "VALUES ($1, $2, $3, $4, $5, $6)",
                    doc_id, uuid.UUID(user_id), file.filename, content, 
                    embedding_str, datetime.utcnow()
                )
            except Exception as db_error:
                print(f"Database insertion error: {str(db_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save document to database: {str(db_error)}"
                )

            return {
                "id": str(doc_id),
                "message": f"Document uploaded successfully! Processed {len(chunks)} text chunks from {len(reader.pages)} pages.",
                "stats": {
                    "pages": len(reader.pages),
                    "chunks": len(chunks),
                    "total_characters": len(content)
                }
            }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error during upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error during upload: {str(e)}")

@app.post("/query")
async def query_document(query: QueryRequest, user_id: str = Depends(get_current_user)):
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
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

@app.get("/documents")
async def get_user_documents(user_id: str = Depends(get_current_user)):
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    try:
        async with pool.acquire() as conn:
            documents = await conn.fetch(
                """
                SELECT id, title, created_at, content
                FROM document 
                WHERE user_id = $1 
                ORDER BY created_at DESC
                """,
                uuid.UUID(user_id)
            )
            
            result = []
            for doc in documents:
                # Calculate stats
                content_length = len(doc['content']) if doc['content'] else 0
                
                result.append({
                    "id": str(doc['id']),
                    "title": doc['title'],
                    "created_at": doc['created_at'].isoformat(),
                    "stats": {
                        "total_characters": content_length,
                        "pages": max(1, content_length // 2000),  # Estimate pages
                        "chunks": max(1, content_length // 500)   # Estimate chunks
                    }
                })
            
            return result
            
    except Exception as e:
        print(f"Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, user_id: str = Depends(get_current_user)):
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    try:
        async with pool.acquire() as conn:
            # Check if document exists and belongs to user
            existing_doc = await conn.fetchrow(
                "SELECT id FROM document WHERE id = $1 AND user_id = $2",
                uuid.UUID(document_id),
                uuid.UUID(user_id)
            )
            
            if not existing_doc:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Delete the document
            await conn.execute(
                "DELETE FROM document WHERE id = $1 AND user_id = $2",
                uuid.UUID(document_id),
                uuid.UUID(user_id)
            )
            
            return {"message": "Document deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete document")
    

@app.post("/flashcards/{id}")
async def generate_flashcards(id: str, request: FlashcardRequest = Depends(), user_id: str = Depends(get_current_user)):
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
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
                response_text = response.text.strip()
                # Clean the response text to extract JSON
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                flashcards = json.loads(response_text.strip())
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
                "id": id,
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

@app.get("/flashcards/{id}", response_model=List[Flashcard])
async def get_flashcards(id: str, user_id: str = Depends(get_current_user)):
    if not pool:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
    
    try:
        async with pool.acquire() as conn:
            flashcards = await conn.fetch(
                "SELECT flashcard_id, question, answer, created_at FROM flashcards WHERE document_id = $1 AND user_id = $2 ORDER BY created_at",
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)