import type { AuthenticatedUserProfile } from "@/src/types";

export interface UserProfileRepository {
  saveUserProfile(userProfile: AuthenticatedUserProfile): Promise<void>;
}
