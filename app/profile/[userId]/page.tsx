import { ProfileScreen } from "@/src/features/profile/components/profile-screen";

interface PublicProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { userId } = await params;

  return <ProfileScreen profileUserId={userId} />;
}
