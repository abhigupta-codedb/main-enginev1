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

export interface UserProfile {
  id?: number;
  userId: string;
  age?: number;
  contactNumber1?: string;
  contactNumber2?: string;
  instagramHandle?: string;
  linkedinProfile?: string;
  twitterHandle?: string;
  facebookProfile?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserApprover {
  id?: number;
  userId: string;
  approverName: string;
  approverEmail: string;
  approverContactNumber1?: string;
  approverContactNumber2?: string;
  approverRelationship?: string;
  approverInstagram?: string;
  approverLinkedin?: string;
  approverTwitter?: string;
  approverFacebook?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRecipient {
  id?: number;
  userId: string;
  recipientName: string;
  recipientEmail: string;
  recipientContactNumber1?: string;
  recipientContactNumber2?: string;
  recipientRelationship?: string;
  recipientInstagram?: string;
  recipientLinkedin?: string;
  recipientTwitter?: string;
  recipientFacebook?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompleteUserProfile {
  user: User;
  profile?: UserProfile;
  approvers: UserApprover[];
  notes?: Array<{
    id: number;
    note: string;
    attachment?: string;
    recipientIds?: number[];
    recipients?: UserRecipient[];
    createdAt: Date;
    updatedAt: Date;
  }>;
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
