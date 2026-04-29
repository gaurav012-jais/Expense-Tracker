# AI-Powered Expense Tracker (FinAI)

A complete, production-ready MERN stack expense tracker with Gemini AI integration for natural language processing and financial insights.

## Features
- **Natural Language Quick Add**: Type "Coffee $4.50 yesterday" → Gemini parses into amount, category, merchant, and date.
- **Smart Categorization**: Gemini suggests the best spending category.
- **AI Spending Insights**: Comprehensive analysis of your spending over the last 30 days, generating actionable savings recommendations and identifying budget anomalies.
- **Advanced 6-Hour API Caching**: Built-in cache service tracks calls per user (limit 20/day).

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Redux Toolkit, Framer Motion.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT Authentication.
- **AI Platform**: Google Gemini 2.0 API.

## Installation
1. Install dependencies in the backend:
   ```bash
   cd server
   npm install
   ```
2. Install dependencies in the frontend:
   ```bash
   cd client
   npm install
   ```
3. Set up your environment variables.

## Environment Setup (`server/.env`)
```env
PORT=5000
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.0-flash"
AI_CACHE_TTL=21600000
DAILY_API_LIMIT=20
```

## Running Locally
From the root directory:
```bash
npm run dev
```
