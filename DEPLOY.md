# CampusRAG Deployment Guide

This guide provides step-by-step instructions for deploying **CampusRAG** to production using modern cloud platforms:
- **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- **Backend API**: [Render](https://render.com) or [Railway](https://railway.app)
- **Database & Vectors**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 1. Prerequisites & Accounts

Before deploying, ensure you have accounts for:
1. **GitHub** (to host the repository)
2. **MongoDB Atlas** (cloud database for users, documents, vectors, and email hub)
3. **Render** or **Railway** (for the Node.js Express backend)
4. **Vercel** or **Netlify** (for the React/Vite frontend)
5. *(Optional)* **Google AI Studio** or **OpenAI** (for remote LLM and embedding API keys)
6. *(Optional)* **Microsoft Azure Portal** (for Outlook / Microsoft 365 Graph API credentials)

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
2. Connect your GitHub repository.
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
| `MICROSOFT_CLIENT_ID` | `<azure-app-client-id>` *(Optional)* | Outlook / Microsoft 365 OAuth client ID |
| `MICROSOFT_CLIENT_SECRET` | `<azure-app-secret>` *(Optional)* | Outlook / Microsoft 365 OAuth client secret |
| `OUTLOOK_REDIRECT_URI` | `https://your-api.com/api/email/outlook/callback` | OAuth redirect URI registered in Azure |
| `DAILY_SUMMARY_CRON` | `0 8 * * *` | Automated daily email digest schedule (8 AM) |

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

## 5. Initial Database Seeding & Verification

Once both frontend and backend are live, initialize the default administrator account, student account, and institutional documents:

### Running Seed via Remote Shell:
From your local machine or through Render/Railway web console:
```bash
# In the server directory with your MONGODB_URI set:
npm run seed
```

This will automatically create:
- **Admin Account**: `admin@campus.edu` (Password: `AdminPassword123!`)
- **Student Account**: `student@campus.edu` (Password: `StudentPassword123!`)
- **5 Starter College Documents**: Admissions Guide, Hostel Rules, Academic Regulations, Placement Policy, and Scholarship Details with vectors indexed into MongoDB.

---

## 6. Production Verification Checklist

- [ ] **Health Check**: `GET https://your-api.com/api/health` returns `{"status":"healthy", "database":{"mongodb":"connected"}}`.
- [ ] **Authentication**: Open frontend URL, click **Sign In**, and log in with the demo student or demo admin account.
- [ ] **RAG Grounding**: Ask *"What are the hostel curfew hours?"* — verify answer generates with citations and expandable source card.
- [ ] **Zero-Hallucination Fallback**: Ask *"How do I bake a pepperoni pizza?"* — verify the system returns an explicit "not found in verified documents" notice with `foundAnswer: false`.
- [ ] **Document Ingestion**: As Admin, navigate to `/admin/documents` and upload a PDF or DOCX file. Verify status progresses from `uploaded` → `processing` → `indexed`.
- [ ] **Telemetry Dashboard**: Check `/admin/dashboard` to confirm total indexed documents and vector chunk counts match Atlas database entries.

---

## 7. Troubleshooting & FAQ

### 1. CORS Errors (`Blocked by CORS policy`)
Ensure `CLIENT_URL` on your backend matches the frontend domain without a trailing slash (e.g., `https://campusrag.vercel.app`).

### 2. File Uploads on Ephemeral Disks (Render/Vercel Free Tier)
Render free tier instances have ephemeral storage. For long-term physical document storage in production, documents can be configured with an AWS S3 or Cloudinary bucket in [uploadMiddleware.js](file:///c:/Users/spartan/Desktop/own%20project/server/src/middleware/uploadMiddleware.js). Note that vector embeddings and extracted chunk texts are permanently stored in MongoDB, so RAG queries remain fully functional even if disk files reset.

### 3. Activating Live Google Gemini or OpenAI Models
To transition from local semantic fallback to neural LLM reasoning:
1. Add `GEMINI_API_KEY` or `OPENAI_API_KEY` to your backend environment variables.
2. Set `EMBEDDING_PROVIDER=gemini` and `LLM_PROVIDER=gemini` (or `openai`).
3. Re-index documents from `/admin/documents` to update vector dimensions.
