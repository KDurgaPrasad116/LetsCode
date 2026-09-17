# LetsCode - Full-Stack Algorithmic Mastery & Problem Tracker

A production-grade, full-stack Data Structures & Algorithms preparation platform and peer study network built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Auth.js (NextAuth v5)**, **Prisma ORM**, and **TanStack React Query**.

Designed with a bespoke dark aesthetic tailored to the **Oxford Navy & Vivid Golden Amber** palette (`#000000`, `#14213d`, `#fca311`, `#e5e5e5`, `#ffffff`).

---

## Key Features

- **250 Curated DSA Problems**: Complete syllabus spanning Arrays, Two Pointers, Sliding Window, Binary Search, Linked Lists, Trees, Graphs, and Dynamic Programming with direct links to LeetCode and TakeUForward.
- **Multi-Tiered Blueprints**: Step-by-step evolution from *Brute Force* $\to$ *Better* $\to$ *Optimal* approaches with Big-O time/space complexity analysis, pseudocode, and implementations in Python, C++, and Java.
- **Spaced Repetition & Revision Tracking**: Record revision counts, mark questions for quick mock-interview review, and track active daily streaks.
- **Private Markdown Scratchpad**: Auto-saved notes and edge case logs for every problem.
- **Community Hub & Study Buddies**:
  - Connect with fellow engineers preparing for top-tier tech roles.
  - Filter peers by target companies (Google, Meta, Amazon, Apple, Microsoft, Netflix, Jane Street, Stripe) and languages (Python, C++, Java).
  - Dynamic community leaderboard ranked by authentic problem solves and revision counts.
- **Authentication**:
  - Genuine **Google OAuth** integration via Auth.js v5.
  - Secure credential-based sign-in with encrypted sessions.
  - Resilient hybrid architecture: Seamlessly falls back to an in-memory session store when an external PostgreSQL database is offline.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components & Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom color tokens & glassmorphism
- **Authentication**: Auth.js / NextAuth v5 (JWT session strategy, Google Provider)
- **Database & ORM**: PostgreSQL with Prisma ORM
- **State & Data Fetching**: TanStack React Query & Zustand
- **Icons**: Lucide React

---

## Getting Started

### 1. Prerequisites

- Node.js 18.17+ or 20+
- npm, yarn, or pnpm

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/KDurgaPrasad116/LetsCode.git
cd LetsCode
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key environment variables:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/letscode_dsa?schema=public"

# Auth.js / NextAuth Secret
AUTH_SECRET="your_secure_random_base64_secret"
NEXTAUTH_URL="http://localhost:3000"

# Google Cloud OAuth Credentials
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"

# Public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup (Optional)

If running a local or hosted PostgreSQL database:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

*Note: If PostgreSQL is not configured, the application automatically runs in mock store mode, allowing full functionality without requiring a database connection.*

### 5. Running the Application

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying to Render & 24/7 Keep-Alive

### 1. Blueprint Deployment (Recommended)

This repository includes a [`render.yaml`](./render.yaml) blueprint for one-click setup:

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\to$ **Blueprint**.
3. Select your repository: `https://github.com/KDurgaPrasad116/LetsCode`.
4. Render will automatically configure:
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Fill in your environment secrets in the prompt:
   - `AUTH_GOOGLE_ID`: Your Google Cloud OAuth Client ID.
   - `AUTH_GOOGLE_SECRET`: Your Google Cloud OAuth Secret.
   - `DATABASE_URL`: (Optional) Your hosted PostgreSQL database (e.g. Neon, Supabase, or Render Postgres). If left empty, LetsCode runs in resilient mock-store mode with in-memory persistence.
6. Click **Apply**. Render will build and deploy your live URL (e.g., `https://letscode.onrender.com`).
7. In **Google Cloud Console**, add your Render callback URL to **Authorized redirect URIs**:
   `https://<your-render-service>.onrender.com/api/auth/callback/google`

---

### 2. How the 24/7 Keep-Alive Works (Never Sleeps)

Render's Free Tier web services automatically spin down after 14 minutes of inactivity. To keep your backend running at all times:

#### Method A: Automated GitHub Actions Keep-Alive (Zero Third-Party Accounts Needed)
This repository includes a pre-configured workflow [`.github/workflows/keep-alive.yml`](./.github/workflows/keep-alive.yml) that sends a heartbeat ping to `/api/health` every 10 minutes:
1. Go to your GitHub repository: [https://github.com/KDurgaPrasad116/LetsCode](https://github.com/KDurgaPrasad116/LetsCode).
2. Navigate to **Settings** $\to$ **Secrets and variables** $\to$ **Actions**.
3. Click **New repository secret**:
   - **Name**: `RENDER_APP_URL`
   - **Value**: `https://<your-app-name>.onrender.com` (your live Render URL)
4. GitHub Actions will now automatically trigger every 10 minutes, keeping your Render container active and preventing cold starts 24/7!

#### Method B: Free External Pingers (Optional Alternative)
You can also set up an external monitor using [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org):
- **URL**: `https://<your-app-name>.onrender.com/api/health`
- **Interval**: Every 10 or 12 minutes
- **HTTP Method**: `GET` or `HEAD`

#### Method C: Built-in Internal Background Pinger
LetsCode also includes [`src/lib/keepAlive.ts`](./src/lib/keepAlive.ts). When deployed on Render (where `RENDER_EXTERNAL_URL` is populated), the Node server self-pings its own public `/api/health` endpoint on an internal interval.

---

## License

MIT License. Built for developers preparing for high-impact software engineering interviews.
