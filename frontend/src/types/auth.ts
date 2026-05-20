export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
