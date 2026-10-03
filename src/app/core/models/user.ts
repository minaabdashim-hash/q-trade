export type UserRole = 'customer' | 'admin';

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  avatarUrl?: string | null;
  defaultAddress?: Address | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch ms at which the access token expires. */
  expiresAt: number;
}

export interface AuthSession extends AuthTokens {
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

export function fullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function hasRole(user: User | null, role: UserRole): boolean {
  return !!user?.roles.includes(role);
}
