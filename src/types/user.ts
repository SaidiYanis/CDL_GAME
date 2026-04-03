export interface AuthenticatedUserProfile {
  displayName: string;
  email: string;
  photoUrl: string | null;
  provider: "google";
  uid: string;
}

export interface UserProfileDocument extends AuthenticatedUserProfile {
  createdAt: string;
  lastLoginAt: string;
}
