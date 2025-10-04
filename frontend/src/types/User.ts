export interface User {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  isRestNow: boolean;
  isBreakMode: boolean;
}
