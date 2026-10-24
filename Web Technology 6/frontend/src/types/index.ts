// Shapes match the MongoDB documents / Spring Boot models we'll build later.

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  rating: number;
  description: string;
  coverColor: string; // used to draw a simple cover when no image is available
  imageUrl?: string;
  inStock: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
