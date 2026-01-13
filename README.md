# O2Controle Frontend

Frontend web application for managing clients, business permits (Alvarás),
and related documents for an accounting office.

This application consumes the **O2Controle Backend API**.

---

## 🚀 Overview

The O2Controle Frontend provides an intuitive interface for:
- Client management
- Alvará (permit) tracking
- Document upload and download
- Status monitoring

This project is intended for **internal use**.

---

## 🧩 Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

---

## 📋 Prerequisites

- Node.js 18+
- npm or bun
- O2Controle Backend running

---

## ⚙️ Installation

```bash
npm install
# or
bun install

---

Environment Variables

Create a .env file based on .env.example:

cp .env.example .env


Main variable:

VITE_API_URL=http://localhost:3000


This variable defines the base URL of the backend API.

🧪 Development
npm run dev


The application will be available at:

http://localhost:8080

📁 Project Structure
src/
├── pages/          # Application pages
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # API client and utilities
├── types/          # TypeScript types
├── App.tsx         # Main component
└── main.tsx        # Application entry point

🔌 API Integration

All API requests use the base URL defined in VITE_API_URL.

Example:

fetch(`${import.meta.env.VITE_API_URL}/api/clientes`)


The API client is centralized inside the src/lib directory.

🏗️ Build
npm run build


The production build will be generated in the dist/ directory.

🚀 Deployment

Recommended platform:

Vercel

Deployment steps:

Connect this repository to Vercel

Configure environment variables:

VITE_API_URL

Deploy

⚠️ Notes

Do not commit .env files

Ensure the backend API is running before starting the frontend

This project is intended for internal use only
