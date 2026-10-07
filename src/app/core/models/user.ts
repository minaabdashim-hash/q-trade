/** B2B partner account; accounts are created by a manager, there is no self sign-up. */
export type UserRole = 'b2b' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  company: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  /** ISO timestamp; the API rejects the token after it. */
  expiresAt: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}
