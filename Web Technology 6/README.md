# Online Book Store

Responsive online book store built with **React + TypeScript** (frontend), **Spring Boot** (backend) and **MongoDB** (database).

## Pages
1. **Home** – hero banner, features, top-rated books
2. **Login** – email/password login with validation
3. **Catalogue** – search, filter by genre, sort by title/price/rating
4. **Registration** – sign-up form with validation (saved to database)

## Project structure
```
online-bookstore/
├── frontend/              React + TypeScript (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/    Navbar, Footer, BookCard
│   │   ├── context/       AuthContext (logged-in user)
│   │   ├── data/          Sample books (used in mock mode)
│   │   ├── pages/         Home, Login, Catalogue, Register
│   │   ├── services/      api.ts (mock / Spring Boot switch)
│   │   ├── types/         TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css      Responsive styles
│   ├── .env.example       copy to .env (VITE_USE_MOCK=true|false)
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── backend/               Spring Boot + MongoDB (see backend/README.md)
```

## Run the frontend
Requires Node.js 18+.
```bash
cd frontend
cp .env.example .env     # Windows: copy .env.example .env
npm install
npm run dev
```
Open http://localhost:5173

Demo login (mock mode): `demo@bookstore.com` / `demo123`

## Run the backend
See `backend/README.md` (needs JDK 17+, Maven, MongoDB).

## Connecting the backend
Set `VITE_USE_MOCK=false` in `frontend/.env` once Spring Boot is running on port 8080.
Vite forwards all `/api` requests to `http://localhost:8080`.
