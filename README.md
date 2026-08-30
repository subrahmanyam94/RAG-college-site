# ⚡ CampusRAG – AI-Powered College Information & RAG Assistant

**CampusRAG** is an enterprise-grade institutional Retrieval-Augmented Generation (RAG) platform tailored for colleges and universities. It allows administrators to upload institutional handbooks, circulars, fee charts, and policy documents (PDF, DOCX, TXT), recursively chunks and embeds their content into a vector database, and allows students to ask complex campus-related questions through an interactive chat interface. Every answer is strictly grounded with verifiable source citations, page numbers, and relevance percentages, featuring a deterministic zero-hallucination fallback engine when verified answers are not found.

---

## 🌟 Key Features

### 🧠 Grounded Institutional RAG Pipeline
- **Strict Verification**: Queries are embedded and evaluated against stored document chunks using vector cosine similarity. Responses are synthesized solely from retrieved institutional context.
- **🛡️ Zero-Hallucination Fallback**: If query similarity falls below the relevance threshold, the engine deterministically returns an official notice stating that information was not found in available documents, setting `foundAnswer: false` rather than fabricating an answer.
- **📚 Interactive Source Citations**: Every generated response includes expandable reference cards displaying document title, page number, knowledge category badge, and match percentage.

### 📄 Ingestion & Chunking Pipeline
- **Multi-Format Extraction**: Parses text from `.pdf`, `.docx`, and `.txt` files up to 15MB with page boundary preservation and null-byte sanitization.
- **Recursive Sliding Chunking**: Splices text into configurable semantic chunks (~750 chars) with sliding overlap (~120 chars) to prevent context loss across paragraph transitions.
- **Lifecycle Tracking**: Full state tracking across `uploaded` → `processing` → `indexed` → `failed`.

### 🧭 Vector Store Abstraction
- **Provider-Agnostic Interface**: Uniform VectorStore API backed by a native in-database MongoDB Cosine Vector Store on `DocumentChunks`.
- **Hybrid Embedding Engines**: Out-of-the-box support for **Google Gemini** (`text-embedding-004`), **OpenAI** (`text-embedding-3-small`), and a deterministic high-dimensional feature hashing engine for instant offline execution.

### 💬 Multi-Turn Conversation History
- **Contextual Continuity**: Maintains multi-turn dialog memory so students can ask contextual follow-up questions.
- **Persistent Archive**: Searchable conversation sessions stored in MongoDB with full message turns, citations, and latency telemetry.

### 🏛️ Admin Telemetry & Document Management
- **Analytics Dashboard**: Real-time KPI metrics on total documents, vector chunks, processing queues, and category distribution.
- **Chunk Inspector**: Examine extracted chunks, estimated token counts, and 768-dimensional vector statuses.
- **Re-Indexing & Cascade Deletion**: One-click re-indexing and cascade deletion of documents with complete vector cleanup.

### 📬 AI Email & Smart Communication Hub
- **⚡ Extract Action Items**: Automatically extracts actionable tasks from campus notices with interactive completion checklists.
- **📅 Extract Dates & Deadlines**: Identifies explicit dates and upcoming deadlines with color-coded urgency badges.
- **🗓️ Calendar Integration**: One-click calendar sync for Google Calendar, Outlook Calendar, and standard `.ics` file downloads.
- **🔍 Smart AI Email Search**: Natural language semantic querying across institutional circulars and messages.
- **🏷️ AI-Based Email Categorization**: Automated categorization into Admissions, Exams, Fees, Hostel, Placements, and Policies.
- **📦 Bulk Email Management**: Batch operations for bulk archiving, marking read, category reassignment, and deletion.
- **📝 Email Templates**: Standardized official university request templates (Bonafide, Leave/Late-Pass, Fee Concession, Exam Appeal, NOC).
- **📬 Multiple Email Accounts**: Unified inbox supporting official student email (`@campus.edu`), department mail, and personal mail.
- **🏢 Outlook Integration**: OAuth 2.0 readiness and Microsoft 365 Graph API sync for Outlook Web and Desktop.
- **🎙️ Voice-to-Email**: Hands-free voice-to-text dictation and speech recognition powered by the Web Speech API.
- **📊 Email Analytics**: Telemetry dashboard tracking volume trends, response rates, and pending action items.
- **🌅 Daily Email Summary**: AI morning briefing digest summarizing all announcements, deadlines, and action items.
- **🎯 AI-Powered Inbox Prioritization**: Intelligent 0-100 priority scoring with Focused vs. General inbox separation.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS + Zustand + React Markdown + Lucide Icons + React Dropzone
- **Styling & Aesthetics**: Modern Desert-Yellow (`#EAB308`), Sunset Orange (`#EA580C`), and Crisp Pure White (`#FFFFFF`) palette with warm desert sand backdrop (`#FAF7F0`)
- **Backend Server**: Node.js + Express.js + Helmet + Rate Limit + Express-Validator + Multer
- **Database**: MongoDB / Mongoose with indexed vector array storage
- **Vector Engine**: CampusRAG-MongoDB-CosineStore with multi-provider embedding layer (Gemini, OpenAI, or local semantic fallback)
- **Security**: Password hashing with bcryptjs (cost 12), JWT session handling with role-based access control (`student` vs. `admin`), scoped CORS, and sanitized text extraction

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher (Recommended: `v20+`)
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas connection URI

---

## 🚀 Quick Start (Running Locally)

### 1. Clone & Navigate to Project
```bash
cd "c:/Users/spartan/Desktop/own project"
```

### 2. Install All Dependencies
Install backend and frontend dependencies:
```bash
# Backend dependencies
cd server && npm install

# Frontend dependencies
cd ../client && npm install
```

### 3. Configure Environment Variables
The repository comes pre-configured with default development `.env` files. To customize keys:

**Sample Backend Config (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection
MONGODB_URI=mongodb://127.0.0.1:27017/campusrag

# Authentication
JWT_SECRET=super_secret_jwt_key_campusrag_2026_production_grade_512bit
JWT_EXPIRES_IN=7d

# RAG & AI Providers (gemini | openai | fallback)
EMBEDDING_PROVIDER=fallback
LLM_PROVIDER=fallback
SIMILARITY_THRESHOLD=0.08
TOP_K=4

# Optional: Remote AI Keys
# GEMINI_API_KEY=your_gemini_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here

# Email & Outlook Hub (Optional)
# MICROSOFT_CLIENT_ID=your_azure_client_id
# MICROSOFT_CLIENT_SECRET=your_azure_client_secret
# OUTLOOK_REDIRECT_URI=http://localhost:5000/api/email/outlook/callback
```

### 4. Seed Starter Data
Initialize default student and admin accounts along with 5 starter college documents:
```bash
cd server
npm run seed
```

### 5. Start the Application

#### Option A: Separate Terminals
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

## 🌐 Access the Application

Once started, open your web browser:
- **Frontend Console**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Health Telemetry**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Sample Local Test Credentials

For instant testing in development mode, the database is pre-configured with sample test accounts (available via one-click demo login buttons on `/login`):

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@campus.edu` | `AdminPassword123!` | Dashboard telemetry, document upload, chunk inspector, reindexing, deletion |
| **Student** | `student@campus.edu` | `StudentPassword123!` | Student chat assistant, source citation inspection, conversation history |

---

## 🧪 Testing the Complete Workflow

1. **Sign In**: Navigate to [http://localhost:5173/login](http://localhost:5173/login) and click **Demo Student**.
2. **Ask Grounded Questions**: In the chat console (`/chat`), click a prompt chip such as:
   - *"What are the hostel curfew hours and late entry rules?"*
   - Verify the assistant returns a grounded answer citing **Hostel Accommodation Rules and Fee Structure**, **Page 1**, with relevance percentage.
3. **Test Zero-Hallucination Fallback**: Ask an unrelated question:
   - *"How do I bake a pepperoni pizza?"*
   - Notice the assistant triggers an amber alert with `foundAnswer: false` and explicitly declines to guess.
4. **Admin Dashboard**: Log out and sign in as **Demo Admin** (`admin@campus.edu`).
5. **Inspect Metrics**: Navigate to `/admin/dashboard` to view live telemetry on total documents, chunks, and category distribution.
6. **Upload & Chunking**: Go to `/admin/documents` to drag-and-drop a new document, or inspect chunk tokens and 768-dim vector embeddings on `/admin/documents/:id`.
7. **Run Automated Test Suite**:
   ```bash
   cd server
   node src/scripts/verifyAll.js
   ```
   All 23 comprehensive end-to-end tests will execute and pass.

---

## 📂 Project Structure

```
.
├── DEPLOY.md                              # Production deployment steps (Render, Vercel, Atlas)
├── README.md                              # Comprehensive platform documentation
├── package.json                           # Root scripts
├── server/                                # Express + MongoDB Backend
│   ├── .env.example                       # Sample environment variables
│   ├── .env                               # Server configuration
│   ├── package.json                       # Backend scripts and dependencies
│   └── src/
│       ├── config/
│       │   ├── env.js                     # Centralized environment validation
│       │   ├── db.js                      # MongoDB connection handler
│       │   └── vectorStore.js             # Agnostic Vector Store interface
│       ├── controllers/
│       │   ├── authController.js          # Authentication controller
│       │   ├── documentController.js      # Document management controller
│       │   └── chatController.js          # RAG chat & query controller
│       ├── middleware/
│       │   ├── authMiddleware.js          # requireAuth & requireAdmin guards
│       │   ├── rateLimitMiddleware.js     # Express rate limiters
│       │   ├── uploadMiddleware.js        # Multer file upload validation (15MB)
│       │   └── errorHandler.js            # Centralized error handler
│       ├── models/
│       │   ├── User.js                    # User schema (bcrypt cost 12)
│       │   ├── Document.js                # Document metadata & status schema
│       │   ├── DocumentChunk.js           # Semantic chunk & vector array schema
│       │   ├── Conversation.js            # Chat session schema
│       │   ├── Message.js                 # Chat turn & citations schema
│       │   └── VectorIndexMeta.js         # Vector store telemetry schema
│       ├── routes/
│       │   ├── authRoutes.js              # /api/auth routes
│       │   ├── documentRoutes.js          # /api/documents routes
│       │   └── chatRoutes.js              # /api/chat routes
│       ├── services/
│       │   ├── authService.js             # User registration & password logic
│       │   ├── ingestionService.js        # PDF/DOCX extraction & sliding chunking
│       │   ├── embeddingService.js        # Vector embedding generation
│       │   ├── retrievalService.js        # Cosine similarity retrieval & gating
│       │   ├── llmService.js              # Grounded synthesis & fallback engine
│       │   ├── documentService.js         # Document lifecycle orchestrator
│       │   └── chatService.js             # Chat persistence & history service
│       ├── scripts/
│       │   ├── seedData.js                # Seed starter users & college policies
│       │   └── verifyAll.js               # 23-test end-to-end verification suite
│       └── index.js                       # Server entrypoint & security middleware
└── client/                                # React + Vite Frontend
    ├── package.json                       # Frontend scripts and dependencies
    ├── index.html                         # App root HTML with Google Fonts & favicon
    ├── tailwind.config.js                 # Desert-Yellow & Orange theme configuration
    ├── postcss.config.js                  # PostCSS plugins
    └── src/
        ├── index.css                      # Desert theme styles & custom scrollbars
        ├── App.jsx                        # Application router & protected routes
        ├── main.jsx                       # Application entrypoint
        ├── store/
        │   ├── authStore.js               # Zustand authentication store
        │   └── chatStore.js               # Zustand chat state store
        ├── lib/
        │   ├── api.js                     # Axios instance with JWT interceptor
        │   └── utils.js                   # Category styling, dates, & percentages
        ├── components/
        │   ├── AppShell/                  # Navbar, Sidebar, AppShell
        │   ├── ChatWindow/                # Main interactive RAG chat feed
        │   ├── MessageBubble/             # Markdown bubble with verified citations
        │   ├── SourceReferenceCard/       # Expandable citation card with page & %
        │   ├── ChatHistorySidebar/        # Session archive drawer
        │   ├── DocumentUploadPanel/       # Drag-and-drop file upload component
        │   ├── MetricGrid/                # Dashboard telemetry metric cards
        │   └── ProtectedRoute/            # Authentication & role route guard
        └── pages/
            ├── LandingPage.jsx            # / - Platform showcase & RAG overview
            ├── LoginPage.jsx              # /login - Login & 1-click demo accounts
            ├── RegisterPage.jsx           # /register - Role selection (student/admin)
            ├── ChatPage.jsx               # /chat - Interactive RAG query console
            ├── ChatHistoryPage.jsx        # /chat/history - Searchable past sessions
            ├── AdminDashboardPage.jsx     # /admin/dashboard - Institutional metrics
            ├── AdminDocumentsPage.jsx     # /admin/documents - Manage documents
            ├── AdminDocumentDetailPage.jsx# /admin/documents/:id - Chunk inspector
            └── SettingsPage.jsx           # /settings - Profile & password management
```

---

## 📡 API Endpoints Reference

### Health & Auth
- `GET /api/health` – System heartbeat, MongoDB status, and vector store telemetry.
- `POST /api/auth/register` – Register a new student or admin account.
- `POST /api/auth/login` – Authenticate credentials and issue JWT.
- `GET /api/auth/me` – Fetch current user profile.
- `POST /api/auth/change-password` – Update user account password.

### Documents & Knowledge Management
- `GET /api/documents` – List documents with pagination, category filter, and search.
- `POST /api/documents/upload` – Upload PDF/DOCX/TXT file (Admin only).
- `GET /api/documents/metrics` – Get aggregate dashboard telemetry (Admin only).
- `GET /api/documents/:id` – Fetch single document with extracted chunks.
- `PUT /api/documents/:id/reindex` – Re-extract and re-index vector embeddings (Admin only).
- `DELETE /api/documents/:id` – Permanently delete document and purge vector chunks (Admin only).

### Chat & RAG Queries
- `POST /api/chat/query` – Submit student question, retrieve chunks, and synthesize grounded answer.
- `GET /api/chat/conversations` – List user's conversation sessions.
- `GET /api/chat/conversations/:id` – Fetch full message turn history of a session.
- `DELETE /api/chat/conversations/:id` – Delete a conversation session.

---

## 📄 License

MIT © 2026 CampusRAG – Institutional AI Operations Platform
