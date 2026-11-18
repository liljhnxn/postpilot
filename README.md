# PostPilot 🚀
### Production-Grade Multi-Account X (Twitter) Publishing & Scheduling Platform

> **"One Dashboard. Multiple Accounts. Effortless Publishing."**

PostPilot is an enterprise-grade SaaS application designed for founders, social media managers, and agencies to draft, enhance, schedule, and publish high-engagement posts and multi-tweet threads simultaneously across multiple X (Twitter) profiles.

---

## ✨ Core Features

- **Multi-Account X Publishing**: Connect and broadcast across multiple X accounts simultaneously via official X API v2 OAuth 2.0 with PKCE and AES-256-GCM token encryption.
- **🧵 Multi-Tweet Thread Builder**: Compose chained replies seamlessly with live reply connectors, contextual card headers (Hook, Expansion, CTA), and 1-click **Auto-Numbering (1/n)**.
- **✨ AI Content Enhancer**: Powered by Google Gemini 1.5 Flash (with smart copywriting heuristic fallbacks). Generate viral hooks, condense posts to punchy lengths ($\le 220$ chars), create 3 distinct tone variations (Hype, Thought Leadership, Conversational), and expand ideas into 3-part threads.
- **🗓️ Interactive Content Calendar**: Visual monthly and weekly grid mapping all upcoming scheduled posts and past dispatches with status badges and 1-click day-slot scheduling.
- **📚 Post Templates & Snippets Playbook**: Curated library of proven viral frameworks (Contrarian Truth, Transformation Stories, 10x Resource Stacks, Feature Launches) + custom user template creator.
- **📊 Performance & Delivery Analytics**: Live delivery success rate KPIs, channel comparison matrix, interactive SVG velocity bar charts with tooltips, and 1-click CSV audit report export.
- **🛠️ Failed Post Management**: Inspect original error messages, edit post text with live 280-weighted character counter, retry immediately, or clear failed posts in bulk.
- **🧪 Simulation / Sandbox Mode**: Built-in toggle to test threads, templates, calendar planning, and analytics freely without exhausting X API credits.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) ("Midnight Luxury" design system: `#0B1020`, `#121A2B`, `#8B5CF6`)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Background Scheduler**: [Inngest](https://www.inngest.com/)
- **X API**: Official X API v2 via `twitter-api-v2` with OAuth 2.0 PKCE
- **Encryption**: Authenticated `AES-256-GCM` symmetric encryption for external access and refresh tokens

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.17+ or v20+)
- A [Supabase](https://supabase.com/) project
- An [X Developer Portal](https://developer.x.com/) account (OAuth 2.0 App)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/postpilot.git
cd postpilot

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

Key environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# X (Twitter) Developer Portal OAuth 2.0
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=http://localhost:3000/api/auth/x/callback

# Security (AES-256-GCM Encryption Key - 64 hex characters)
TOKEN_ENCRYPTION_KEY=your_64_character_hex_encryption_key

# Optional: Google Gemini API Key for AI Enhancer
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup
Run the SQL migration in `supabase/migrations/001_initial_schema.sql` inside your Supabase SQL Editor.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Security Architecture

PostPilot does not store plain-text access or refresh tokens. When an account is connected via OAuth 2.0 PKCE, tokens are encrypted server-side using **AES-256-GCM** (incorporating a random 12-byte IV and 16-byte authentication tag) before being committed to PostgreSQL. Tokens are never exposed across client API responses.

---

## 📄 License
MIT License. Created with ❤️ for founders and content creators.

