# 🎓 InquiroAI - Learning Assistant

Welcome to **InquiroAI**, an innovative learning assistant designed to enhance your study experience by leveraging advanced AI technologies. This project allows users to upload study materials, generate educational flashcards, and interact with an AI-powered assistant to answer queries based on uploaded documents. Built with a robust tech stack, InquiroAI combines modern web development, AI-driven natural language processing, and vector-based search capabilities.

## 📋 Overview

InquiroAI is a web-based application that empowers students and educators by providing tools to manage and learn from study materials efficiently. Key features include:

- **📄 Document Upload**: Upload PDF, DOCX, and TXT files to create a personalized knowledge base.
- **🃏 Flashcard Generation**: Automatically generate customizable flashcards from uploaded documents to aid memorization.
- **🤖 AI Assistant**: Query your documents with natural language and receive context-aware responses.
- **🔐 User Authentication**: Secure login and registration with JWT-based authentication.
- **📱 Responsive Design**: Intuitive and user-friendly interface for seamless interaction.

## 📸 Screenshots

### 📤 Upload Documents
![Upload Documents Tab](https://raw.githubusercontent.com/simantini07/InquiroAI-/main/upload%20file%20(1).jpg)
*Upload your study materials with support for PDF, DOCX, and TXT formats.*

### 🤖 AI Assistant
![AI Assistant Tab](https://raw.githubusercontent.com/simantini07/InquiroAI-/main/Assistant.jpg)
*Interact with the AI to ask questions and get answers based on your documents.*

### 🃏 Flashcards
![Flashcards Tab](https://raw.githubusercontent.com/simantini07/InquiroAI-/main/flashcard%20(1).jpg)
*View and flip through generated flashcards for effective learning.*

## 🛠️ Tech Stack

This project showcases a blend of cutting-edge technologies and frameworks:

### **⚡ Backend**:
- **FastAPI**: Asynchronous web framework for building APIs with Python.
- **asyncpg**: Asynchronous PostgreSQL client for efficient database operations.
- **PyPDF2**: Library for extracting text from PDF files.
- **bcrypt**: Secure password hashing for user authentication.
- **jwt**: JSON Web Tokens for secure authentication and authorization.
- **sentence-transformers**: Utilizes the `all-MiniLM-L6-v2` model for generating vector embeddings.
- **nltk**: Natural Language Toolkit for text processing and sentence tokenization.
- **google-generativeai**: Integrates Gemini API for AI-driven content generation.

### **🗄️ Database**:
- **PostgreSQL with pgvector**: Dockerized PostgreSQL instance with vector support for similarity search using embeddings.

### **🎨 Frontend** :
- **React**: Modern JavaScript library for building dynamic user interfaces.
- **Material-UI**: Component library for responsive and stylized UI elements.
- **lucide-react**: Icon library for enhanced visual design.


## 🔧 Installation

1. **📥 Clone the Repository**:
   ```bash
   git clone https://github.com/simantini07/InquiroAI-.git
   cd InquiroAI-
   ```
