export interface ExtendedUser {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  role?: string;
}