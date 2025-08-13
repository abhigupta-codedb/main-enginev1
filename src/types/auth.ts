export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{
    value: string;
    verified: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
  provider: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: User;
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      picture?: string;
      provider: string;
      createdAt: Date;
      lastLogin?: Date;
    }
  }
}
