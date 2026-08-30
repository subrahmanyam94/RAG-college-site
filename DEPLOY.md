# CampusRAG Deployment Guide

This guide provides step-by-step instructions for deploying **CampusRAG** to production using modern cloud platforms:
- **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- **Backend API**: [Render](https://render.com) or [Railway](https://railway.app)
- **Database & Vectors**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 1. Prerequisites & Accounts

Before deploying, ensure you have accounts for:
1. **GitHub** (to host the repository)
2. **MongoDB Atlas** (cloud database for users, documents, vectors, and live exam results)
3. **Render** or **Railway** (for the Node.js Express backend)
4. **Vercel** or **Netlify** (for the React/Vite frontend)
5. *(Optional)* **Google AI Studio** or **OpenAI** (for remote LLM and embedding API keys)

---

## 2. MongoDB Atlas Database Setup

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free shared cluster (e.g. **M0 Free Tier**).
3. Under **Security → Database Access**:
   - Create a database user (e.g., `campusrag_admin`) with password and read/write privileges.
4. Under **Security → Network Access**:
   - Click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) so cloud servers (Render/Railway) can connect.
5. Under **Deployments → Database → Connect**:
   - Choose **Drivers → Node.js**.
   - Copy the connection string. It will look like:
     ```bash
     mongodb+srv://campusrag_admin:<password>@cluster0.abcde.mongodb.net/campusrag?retryWrites=true&w=majority
     ```

---

## 3. Backend Deployment (Render or Railway)

### Option A: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New → Web Service**.
2. Connect your GitHub repository (`subrahmanyam94/RAG-college-site`).
3. Configure the service settings:
   - **Name**: `campusrag-api`
   - **Region**: Select closest to your users (e.g., Oregon or Frankfurt)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` or `Starter`
4. Under **Environment Variables**, add the following:

| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production environment mode |
| `PORT` | `10000` | Render default web service port |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `<random-64-character-string>` | Cryptographic secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT session lifetime |
| `CLIENT_URL` | `https://your-campusrag.vercel.app` | Production URL of your deployed frontend |
| `EMBEDDING_PROVIDER` | `gemini` / `openai` / `fallback` | Selected vector embedding generator |
| `LLM_PROVIDER` | `gemini` / `openai` / `fallback` | Selected conversational LLM engine |
| `GEMINI_API_KEY` | `AIzaSy...` *(Optional)* | Google Generative AI API Key |
| `OPENAI_API_KEY` | `sk-...` *(Optional)* | OpenAI API Key |
| `SIMILARITY_THRESHOLD` | `0.55` (remote) or `0.08` (fallback) | Minimum cosine similarity threshold |
| `TOP_K` | `4` | Max retrieved chunks passed to LLM |

5. Click **Deploy Web Service**.
6. Once deployed, note your public API URL (e.g., `https://campusrag-api.onrender.com`).
7. Verify backend health by visiting: `https://campusrag-api.onrender.com/api/health`.

---

### Option B: Deploy on Railway

1. Go to [Railway Dashboard](https://railway.app/) and click **New Project → Deploy from GitHub Repo**.
2. Select your repository.
3. In service settings:
   - Set **Root Directory** to `/server`.
   - Build command: `npm install`.
   - Start command: `npm start`.
4. Add the same environment variables listed above.
5. Under **Settings → Networking**, click **Generate Domain** to receive your public HTTPS URL.

---

## 4. Frontend Deployment (Vercel or Netlify)

### Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New → Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click Edit and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Under **Environment Variables**, add:

| Variable | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://campusrag-api.onrender.com/api` | Your deployed backend API endpoint |

5. Click **Deploy**.
6. Vercel will build the production bundle and assign your application URL (e.g., `https://campusrag.vercel.app`).
7. **Important**: Copy your Vercel URL and update `CLIENT_URL` in your backend environment variables to ensure CORS policies allow cross-origin requests.

---

## 5. Initial Database Seeding & Production Data

Once both frontend and backend are live, initialize the default administrator account, student account, starter institutional documents, and live student exam records:

### Running Seed via Remote Shell or Local Machine:
From your local machine or through Render/Railway web console:
```bash
# In the server directory with your MONGODB_URI set:
npm run seed
```

This will automatically create and sync:
- **Admin Account**: `admin@campus.edu` (Password: `AdminPassword123!`)
- **Student Account**: `student@campus.edu` (Password: `StudentPassword123!`, Roll: `23CS101`)
- **5 Starter College Documents**: Admissions Guide, Hostel Rules, Academic Regulations, Placement Policy, and Scholarship Details with vectors indexed into MongoDB.
- **Live Student Exam Records**:
  - **Alex Student (`23CS101`)**: Semester 4 (SGPA: 8.76, CGPA: 9.06) & Semester 5 (SGPA: 9.38, CGPA: 9.16)
  - **Priya Sharma (`22CS104`)**: Semester 5 (SGPA: 8.94, CGPA: 8.85)

---

## 6. Managing & Deploying Exam Results Data

CampusRAG operates as a **Hybrid RAG system**, answering queries by combining unstructured document vector search with live structured MongoDB database lookups.

### Seeded Exam Results Reference:

| Roll Number | Student Name | Semester | SGPA | CGPA | Key Subjects & Grades | Status |
|:---|:---|:---:|:---:|:---:|:---|:---:|
| **`23CS101`** | **Alex Student** *(Default Demo)* | **Sem 5** | **9.38** | **9.16** | Networks (`O`), AI (`A+`), Software Eng (`A`), Web Tech (`O`), ML Lab (`O`) | **Pass** |
| **`23CS101`** | **Alex Student** *(Default Demo)* | **Sem 4** | **8.76** | **9.06** | Algorithms (`A+`), OS (`A`), Theory of Computation (`B+`), DBMS (`O`), Lab (`O`) | **Pass** |
| **`22CS104`** | **Priya Sharma** | **Sem 5** | **8.94** | **8.85** | Networks (`A`), AI (`O`), Software Eng (`A+`), Web Tech (`A`), ML Lab (`O`) | **Pass** |

*(For full details, see [DB_REFERENCE_SHEET.md](./DB_REFERENCE_SHEET.md))*

### How to Add New Student Exam Results:

#### Method A: Via REST API
Send an authenticated `POST` request as Admin (`Bearer <token>`):
- **Single Record**: `POST /api/results`
- **Batch Array**: `POST /api/results/batch`
```json
{
  "results": [
    {
      "rollNumber": "23CS105",
      "studentName": "Rahul Verma",
      "semester": 5,
      "academicYear": "2025-2026",
      "department": "Computer Science & Engineering",
      "subjects": [
        { "courseCode": "CS501", "courseName": "Computer Networks", "credits": 4, "marks": 88, "grade": "A+", "gradePoints": 9, "status": "Pass" },
        { "courseCode": "CS502", "courseName": "Artificial Intelligence", "credits": 4, "marks": 95, "grade": "O", "gradePoints": 10, "status": "Pass" }
      ],
      "totalCredits": 8,
      "earnedCredits": 8,
      "sgpa": 9.50,
      "cgpa": 9.20,
      "resultStatus": "Pass"
    }
  ]
}
```

#### Method B: Direct in MongoDB Atlas
Navigate to **MongoDB Atlas → Browse Collections → campusrag → examresults → Insert Document**.

---

## 7. Production Verification Checklist

- [ ] **Health Check**: `GET https://your-api.com/api/health` returns `{"status":"healthy", "database":{"mongodb":"connected"}}`.
- [ ] **Authentication**: Open frontend URL, click **Sign In**, and log in with demo student (`student@campus.edu` / `StudentPassword123!`).
- [ ] **Live DB Exam Grounding**: Ask *"Show my semester 5 exam results & SGPA"* — verify response formats a subject breakdown table with SGPA `9.38`, CGPA `9.16`, and an emerald **"Live DB Record" (100% DB Exact)** source citation.
- [ ] **Peer Student Lookup**: Ask *"What is the result for roll number 22CS104?"* — verify Priya Sharma's transcript is retrieved.
- [ ] **Document Vector Grounding**: Ask *"What are the hostel curfew hours?"* — verify answer generates from official circulars with citations.
- [ ] **Zero-Hallucination Fallback**: Ask *"How do I bake a pepperoni pizza?"* — verify the system returns an explicit "not found in verified documents" notice with `foundAnswer: false`.
- [ ] **Document Ingestion**: As Admin, navigate to `/admin/documents` and upload a PDF or DOCX file. Verify status progresses from `uploaded` → `processing` → `indexed`.

---

## 8. Troubleshooting & FAQ

### 1. CORS Errors (`Blocked by CORS policy`)
Ensure `CLIENT_URL` on your backend matches the frontend domain without a trailing slash (e.g., `https://campusrag.vercel.app`).

### 2. Live Generative Neural LLM Reasoning
To transition from local grounded synthesis to neural Gemini/OpenAI reasoning:
1. Add `GEMINI_API_KEY` (starts with `AIzaSy...` from [Google AI Studio](https://aistudio.google.com/app/apikey)) to your Render environment variables.
2. Set `EMBEDDING_PROVIDER=gemini` and `LLM_PROVIDER=gemini`.
3. Re-index documents from `/admin/documents`.
