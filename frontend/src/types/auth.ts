import type { UserRole } from './issue';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
}
