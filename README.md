# ⚡ CampusRAG – AI-Powered College Information & Hybrid RAG Assistant

**CampusRAG** is an enterprise-grade institutional **Hybrid Retrieval-Augmented Generation (RAG)** platform tailored for colleges and universities. It seamlessly grounds AI answers in both **unstructured institutional circulars/documents (Vector Search)** and **live structured databases (MongoDB Student Exam Results, Academic Records, SGPA/CGPA)**.

Every answer is strictly verifiable with interactive source citations, page numbers, and live database seals, backed by a deterministic zero-hallucination engine when facts are not present in official records.

---

## 🌟 Key Features

### 🎓 Live Student Exam Results & Academic Database (Structured RAG)
- **Direct Database Lookups**: Students can ask *"Show my semester 5 results"*, *"What is my CGPA?"*, or *"Check grades for roll 23CS101"*, and the system queries the live MongoDB transactional database directly.
- **Subject-Wise Grade Breakdown**: Automatically formats complete semester performance tables including Course Code, Course Name, Credits, Marks, Letter Grades (`O`, `A+`, `A`, `B+`, `B`, `C`, `F`), Grade Points, SGPA, CGPA, and Controller of Examinations declaration status.
- **Dual Citation Badges**: Renders a distinct **"Live DB Record" (100% DB Exact)** emerald citation card for database records alongside standard document vector source cards.

### 🧠 Grounded Institutional RAG Pipeline (Unstructured Vector Search)
- **Strict Fact Verification**: Queries are embedded and evaluated against stored document chunks using cosine similarity vector search. Responses are synthesized solely from retrieved institutional context.
- **🛡️ Zero-Hallucination Fallback**: If query similarity falls below the relevance threshold, the engine deterministically returns an official notice stating that information was not found in available documents (`foundAnswer: false`), preventing AI hallucinations.
- **📚 Interactive Source Citations**: Every generated response includes expandable reference cards displaying document title, page number, knowledge category badge, and similarity percentage.

### 📄 Ingestion & Chunking Pipeline
- **Multi-Format Extraction**: Parses text from `.pdf`, `.docx`, and `.txt` files up to 15MB with page boundary preservation and sanitization.
- **Recursive Sliding Chunking**: Splices text into configurable semantic chunks (~750 chars) with sliding overlap (~120 chars) to prevent context loss across paragraph transitions.
- **Lifecycle Tracking**: Full state tracking across `uploaded` → `processing` → `indexed` → `failed`.

### 🧭 Vector Store Abstraction
- **Provider-Agnostic Interface**: Uniform VectorStore API backed by a native in-database MongoDB Cosine Vector Store on `DocumentChunks`.
- **Hybrid Embedding Engines**: Out-of-the-box support for **Google Gemini** (`text-embedding-004`), **OpenAI** (`text-embedding-3-small`), and a deterministic high-dimensional semantic feature embedder for instant zero-API-key offline execution.

### 💬 Multi-Turn Conversation History
- **Contextual Continuity**: Maintains multi-turn dialog memory so students can ask contextual follow-up questions.
- **Persistent Archive**: Searchable conversation sessions stored in MongoDB with full message turns, citations, and latency telemetry.

### 🏛️ Admin Telemetry & Document Management
- **Analytics Dashboard**: Real-time KPI metrics on total documents, vector chunks, processing queues, and category distribution.
- **Chunk Inspector**: Examine extracted chunks, estimated token counts, and 768-dimensional vector statuses.
- **Re-Indexing & Cascade Deletion**: One-click re-indexing and cascade deletion of documents with complete vector cleanup.

---

## 📊 Database & Retrieval Reference Sheet

For a complete cheat sheet of all seeded documents, student accounts, roll numbers, and sample queries, see [DB_REFERENCE_SHEET.md](./DB_REFERENCE_SHEET.md).

### Seeded Exam Results Snapshot:

| Roll Number | Student Name | Semester | SGPA | CGPA | Key Subjects & Grades | Status |
|:---|:---|:---:|:---:|:---:|:---|:---:|
| **`23CS101`** | **Alex Student** *(Default Demo)* | **Sem 5** | **9.38** | **9.16** | Networks (`O`), AI (`A+`), Software Eng (`A`), Web Tech (`O`), ML Lab (`O`) | **Pass** |
| **`23CS101`** | **Alex Student** *(Default Demo)* | **Sem 4** | **8.76** | **9.06** | Algorithms (`A+`), OS (`A`), Theory of Computation (`B+`), DBMS (`O`), Lab (`O`) | **Pass** |
| **`22CS104`** | **Priya Sharma** | **Sem 5** | **8.94** | **8.85** | Networks (`A`), AI (`O`), Software Eng (`A+`), Web Tech (`A`), ML Lab (`O`) | **Pass** |

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + Zustand + React Markdown + Lucide Icons + React Dropzone
- **Theme & Styling**: Modern Desert-Yellow (`#EAB308`), Sunset Orange (`#EA580C`), and Warm Sand Backdrop (`#FAF7F0`)
- **Backend Server**: Node.js + Express.js + Helmet + Rate Limit + Express-Validator + Multer
- **Database**: MongoDB Atlas / Mongoose (Collections: `users`, `examresults`, `documents`, `documentchunks`, `conversations`, `messages`)
- **Vector Engine**: Native MongoDB Cosine Vector Store with dynamic fallback calibration
- **Security**: Password hashing with bcryptjs (cost 12), JWT session handling with role-based access control (`student` vs. `admin`), and scoped CORS

---

## 🚀 Quick Start (Running Locally)

### 1. Clone & Navigate to Project
```bash
cd "c:/Users/spartan/Desktop/own project"
```

### 2. Install All Dependencies
```bash
# Backend dependencies
cd server && npm install

# Frontend dependencies
cd ../client && npm install
```

### 3. Configure Environment Variables (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/campusrag
JWT_SECRET=super_secret_jwt_key_campusrag_2026_production_grade_512bit
JWT_EXPIRES_IN=7d

# RAG & AI Configuration (fallback | gemini | openai)
EMBEDDING_PROVIDER=fallback
LLM_PROVIDER=fallback
SIMILARITY_THRESHOLD=0.08
TOP_K=4

# Optional: Google Gemini or OpenAI Keys
# GEMINI_API_KEY=AIzaSy...
# OPENAI_API_KEY=sk-...
```

### 4. Seed Starter Data
Initialize default student and admin accounts, starter institutional documents, and live student exam records:
```bash
cd server
npm run seed
```

### 5. Start the Application
**Terminal 1 (Backend API - Port 5000):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend Client - Port 5173):**
```bash
cd client
npm run dev -- --port 5173
```

---

## 🔑 Default Test Accounts

| Role | Email | Password | Linked Roll No | Permissions |
|:---|:---|:---|:---:|:---|
| **Student** | `student@campus.edu` | `StudentPassword123!` | `23CS101` | Chat assistant, exam results lookups, citations |
| **Admin** | `admin@campus.edu` | `AdminPassword123!` | — | Dashboard telemetry, document uploads, chunk inspector, reindexing |

---

## 🧪 Sample Queries to Try in Chat

### 🎓 Live Database Lookups (Exam Results & Transcripts):
- *"Show my semester 5 exam results & SGPA"*
- *"What is my current CGPA and subject grades?"*
- *"What is the exam result and CGPA for roll number 22CS104?"*
- *"What did I score in Database Management Systems in semester 4?"*

### 📑 Official Document Vector Retrieval:
- *"What are the hostel curfew hours and late entry rules?"*
- *"Explain the placement policy and dream company offer criteria."*
- *"What is the minimum attendance required for final exams?"*
- *"How do I qualify for merit-based scholarships or financial aid?"*

### 🛡️ Zero-Hallucination Guardrail Check:
- *"How do I bake a pepperoni pizza?"* *(Returns explicit "not found in verified documents" notice)*

---

## 📡 API Endpoints Reference

### Health & Root
- `GET /` – API service info and endpoints list.
- `GET /api/health` – System heartbeat, MongoDB status, and vector store telemetry.

### Authentication
- `POST /api/auth/register` – Register a new student or admin account.
- `POST /api/auth/login` – Authenticate credentials and issue JWT.
- `GET /api/auth/me` – Fetch current user profile.
- `POST /api/auth/change-password` – Update user account password.

### Live Exam Results Database
- `GET /api/results/my-results` – Fetch authenticated student's semester results.
- `GET /api/results/lookup/:rollNumber` – Look up public student results by Roll Number.
- `POST /api/results` – Create or update a student exam record *(Admin only)*.
- `POST /api/results/batch` – Bulk upload multiple student results as JSON array *(Admin only)*.
- `DELETE /api/results/:id` – Delete an exam record *(Admin only)*.

### Documents & Knowledge Management
- `GET /api/documents` – List documents with pagination, category filter, and search.
- `POST /api/documents/upload` – Upload PDF/DOCX/TXT file *(Admin only)*.
- `GET /api/documents/metrics` – Get aggregate dashboard telemetry *(Admin only)*.
- `GET /api/documents/:id` – Fetch single document with extracted chunks.
- `PUT /api/documents/:id/reindex` – Re-extract and re-index vector embeddings *(Admin only)*.
- `DELETE /api/documents/:id` – Permanently delete document and purge vector chunks *(Admin only)*.

### Chat & RAG Queries
- `POST /api/chat/query` – Submit student question, query live DB + vector store, and synthesize grounded answer.
- `GET /api/chat/conversations` – List user's conversation sessions.
- `GET /api/chat/conversations/:id` – Fetch full message turn history of a session.
- `DELETE /api/chat/conversations/:id` – Delete a conversation session.

---

## 📂 Project Structure

```
.
├── DB_REFERENCE_SHEET.md                  # Comprehensive Database & Knowledge Reference Sheet
├── DEPLOY.md                              # Production deployment steps (Render, Vercel, Atlas)
├── README.md                              # Complete platform documentation
├── package.json                           # Root scripts
├── server/                                # Express + MongoDB Backend
│   ├── package.json                       # Backend scripts and dependencies
│   └── src/
│       ├── config/
│       │   ├── env.js                     # Environment validation
│       │   ├── db.js                      # MongoDB connection handler
│       │   └── vectorStore.js             # Vector Store interface
│       ├── controllers/
│       │   ├── authController.js          # Authentication controller
│       │   ├── documentController.js      # Document management controller
│       │   ├── examResultController.js    # Student exam results controller
│       │   └── chatController.js          # RAG chat & query controller
│       ├── middleware/
│       │   ├── authMiddleware.js          # requireAuth & requireAdmin guards
│       │   ├── rateLimitMiddleware.js     # Express rate limiters
│       │   ├── uploadMiddleware.js        # Multer file upload validation (15MB)
│       │   └── errorHandler.js            # Centralized error handler
│       ├── models/
│       │   ├── User.js                    # User schema with rollNumber
│       │   ├── ExamResult.js              # Student academic records & marks schema
│       │   ├── Document.js                # Document metadata & status schema
│       │   ├── DocumentChunk.js           # Semantic chunk & vector array schema
│       │   ├── Conversation.js            # Chat session schema
│       │   ├── Message.js                 # Chat turn & source citations schema
│       │   └── VectorIndexMeta.js         # Vector store telemetry schema
│       ├── routes/
│       │   ├── authRoutes.js              # /api/auth routes
│       │   ├── documentRoutes.js          # /api/documents routes
│       │   ├── examResultRoutes.js        # /api/results routes
│       │   └── chatRoutes.js              # /api/chat routes
│       ├── services/
│       │   ├── authService.js             # User authentication logic
│       │   ├── examResultService.js       # Live student database retrieval & formatting
│       │   ├── ingestionService.js        # PDF/DOCX extraction & sliding chunking
│       │   ├── embeddingService.js        # Multi-provider vector embedding generator
│       │   ├── retrievalService.js        # Cosine similarity retrieval & gating
│       │   ├── llmService.js              # Hybrid grounded synthesis & fallback engine
│       │   ├── documentService.js         # Document lifecycle orchestrator
│       │   └── chatService.js             # Chat persistence & hybrid query orchestrator
│       ├── scripts/
│       │   ├── seedData.js                # Seed starter users, documents & exam records
│       │   └── verifyAll.js               # 23-test end-to-end verification suite
│       └── index.js                       # Server entrypoint & security middleware
└── client/                                # React + Vite Frontend
    ├── package.json                       # Frontend scripts and dependencies
    └── src/
        ├── App.jsx                        # Application router & protected routes
        ├── store/
        │   ├── authStore.js               # Zustand authentication store
        │   └── chatStore.js               # Zustand chat state store
        ├── lib/
        │   ├── api.js                     # Normalized Axios instance with JWT interceptor
        │   └── utils.js                   # Category styling, dates, & formatting
        ├── components/
        │   ├── ChatWindow/                # Hybrid RAG chat console with suggestions
        │   ├── MessageBubble/             # Markdown bubble with verified citations
        │   ├── SourceReferenceCard/       # Expandable citation card (DB & Document badges)
        │   ├── AppShell/                  # Navbar, Sidebar, AppShell
        │   ├── DocumentUploadPanel/       # Drag-and-drop file upload component
        │   └── MetricGrid/                # Dashboard telemetry metric cards
        └── pages/
            ├── LandingPage.jsx            # Platform showcase
            ├── LoginPage.jsx              # Login with 1-click demo accounts
            ├── ChatPage.jsx               # Interactive hybrid RAG query console
            ├── AdminDashboardPage.jsx     # Institutional metrics
            └── AdminDocumentsPage.jsx     # Document manager & chunk inspector
```

---

## 📄 License

MIT © 2026 CampusRAG – Institutional AI Operations Platform
