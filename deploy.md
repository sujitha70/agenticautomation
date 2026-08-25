# Production Deployment Guide: Agentflow_AI

This guide walks you through deploying **Agentflow_AI** to production:
- **Backend API & WebSockets**: [Render.com](https://render.com)
- **Frontend Next.js UI**: [Vercel.com](https://vercel.com)
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com)

---

## Step 1: Push Code to GitHub

Make sure your repository has `.gitignore` (already configured to exclude `.env` and `node_modules`).

Open your terminal in the project root (`c:\Users\sujit\OneDrive\Desktop\ai antigravity`):

```bash
# 1. Initialize git repository (if not already done)
git init

# 2. Stage all project files
git add .

# 3. Commit files
git commit -m "feat: complete Agentflow_AI platform for production deployment"

# 4. Create a new repository on GitHub (e.g. https://github.com/new named agentflow-ai)
# 5. Link and push to GitHub:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/agentflow-ai.git
git branch -M main
git push -u origin main
```

---

## Step 2: Configure MongoDB Atlas (Network Access)

Because Render servers use dynamic cloud IP addresses, ensure MongoDB Atlas accepts incoming connections from Render:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Under **Security** in the left sidebar, click **Network Access**.
3. Click **Add IP Address**.
4. Choose **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Confirm**.

---

## Step 3: Deploy Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Select your GitHub repository (`agentflow-ai`).
4. Configure the Web Service:
   - **Name**: `agentflow-backend` (or your preferred name)
   - **Region**: Choose the closest region (e.g. *Oregon, Frankfurt, Singapore*)
   - **Branch**: `main`
   - **Root Directory**: `server` ⚠️ *(Make sure to set this to `server`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. Scroll down to **Environment Variables** and add the following keys:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production mode |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster.mongodb.net/agentflow_ai?appName=agenticai` | Your MongoDB connection string |
| `USE_IN_MEMORY_DB` | `false` | Enables MongoDB Atlas connection |
| `JWT_SECRET` | `prod_jwt_super_secret_key_agentflow_2026` | 32+ char secret for JWT auth |
| `CREDENTIAL_ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | AES-256 key to encrypt tokens at rest |
| `USE_IN_MEMORY_QUEUE` | `true` | In-memory job queue for background agent tasks |
| `GEMINI_API_KEY` | `your_gemini_api_key_here` | Gemini AI key for workflow generation |
| `CLIENT_URL` | `http://localhost:3000` *(Temporary - update in Step 5 with your Vercel URL)* | Allowed CORS origin |

6. Click **Create Web Service**.
7. Render will build and start your server. Once live, note your backend URL:
   - Example: `https://agentflow-backend.onrender.com`

---

## Step 4: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`agentflow-ai`).
4. In the configuration screen:
   - **Project Name**: `agentflow-ai`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select **`client`** ⚠️ *(Important: select `client`)*
5. Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://agentflow-backend.onrender.com/api` *(Your Render URL + `/api`)* |
| `NEXT_PUBLIC_SOCKET_URL` | `https://agentflow-backend.onrender.com` *(Your Render URL)* |

6. Click **Deploy**.
7. Vercel will build and deploy your frontend. Once complete, you will receive your live URL:
   - Example: `https://agentflow-ai.vercel.app`

---

## Step 5: Update CORS on Render Backend

Now that you have your live Vercel URL:

1. Go back to your [Render Dashboard](https://dashboard.render.com).
2. Open your `agentflow-backend` service → **Environment**.
3. Find `CLIENT_URL` and update its value to your Vercel domain:
   - `CLIENT_URL` = `https://agentflow-ai.vercel.app`
4. Click **Save Changes**. Render will automatically redeploy with the updated CORS policy.

---

## Step 6: Verify Your Production Deployment

1. Open your live Vercel URL in your browser: `https://agentflow-ai.vercel.app`.
2. Check the top navbar: the status indicator should display **`LIVE STREAM`** in green (confirming Socket.IO connection to Render).
3. Navigate to `/register` or `/login` and create an operator account.
4. Try generating a workflow with the AI builder and run an execution to watch real-time multi-agent streaming in production.
