# O2Controle Frontend

Frontend web application for managing clients, business permits (Alvaras), and related documents for an accounting office.

This application consumes the O2Controle Backend API.

## Overview

The O2Controle Frontend provides an interface for:

- Client management
- Alvara tracking
- Document upload and download
- Status monitoring

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## Prerequisites

- Node.js 18+
- npm or bun

## Installation

```bash
npm install
```

or

```bash
bun install
```

## Environment Variables

Create a local environment file based on `.env.example`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Main variable:

```env
VITE_API_URL=https://o2controle-backend.onrender.com/api
```

`VITE_API_URL` must contain the full API base, including `/api`, because the frontend appends routes such as `/clientes`, `/alvaras`, and `/auth/login` directly to this value.

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

## API Integration

All API requests use the base URL defined in `VITE_API_URL`.

Example:

```ts
fetch(`${import.meta.env.VITE_API_URL}/clientes`);
```

The API client is centralized in `src/lib/api-client.ts`.

## Build

```bash
npm run build
```

The production build will be generated in the `dist/` directory.

## Deployment

If you deploy the frontend, configure the same environment variable in the hosting platform:

```env
VITE_API_URL=https://o2controle-backend.onrender.com/api
```

## Notes

- Do not commit environment files other than `.env.example`
- Restart the Vite dev server after changing environment variables
- The backend health check is available at `https://o2controle-backend.onrender.com/api/health`
