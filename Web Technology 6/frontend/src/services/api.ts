import type { AuthResponse, Book, LoginRequest, RegisterRequest, User } from '../types';
import { sampleBooks } from '../data/books';

// Switch with VITE_USE_MOCK in the .env file.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_BASE = '/api'; // proxied to Spring Boot (see vite.config.ts)

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ---------- Mock implementation (no backend needed) ----------
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const mockUsers: (User & { password: string })[] = [
  { id: 'u1', fullName: 'Demo User', email: 'demo@bookstore.com', password: 'demo123' },
];

const mockApi = {
  async getBooks(): Promise<Book[]> {
    await delay();
    return sampleBooks;
  },
  async login({ email, password }: LoginRequest): Promise<AuthResponse> {
    await delay();
    const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) throw new Error('Invalid email or password');
    const { password: _pw, ...user } = found;
    return { user, token: 'mock-token' };
  },
  async register(data: RegisterRequest): Promise<AuthResponse> {
    await delay();
    if (mockUsers.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    const newUser = { id: `u${mockUsers.length + 1}`, ...data };
    mockUsers.push(newUser);
    const { password: _pw, ...user } = newUser;
    return { user, token: 'mock-token' };
  },
};

// ---------- Real implementation (Spring Boot + MongoDB) ----------
const realApi = {
  getBooks: () => request<Book[]>('/books'),
  login: (data: LoginRequest) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: RegisterRequest) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

export const api = USE_MOCK ? mockApi : realApi;
