import { useAuth } from "../context/AuthContext";
import UserMetaCard from "../components/UserProfile/UserMetaCard";

export default function UserProfiles() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="rounded-2xl border border-gray-200">
      <h3 className="mb-5 text-lg font-semibold text-gray-800">Profile</h3>
      <div className="space-y-6">
        <UserMetaCard
          user={{
          ...user,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
        }}
/>
        {/* <UserInfoCard /> or omit this if you no longer want address info */}
      </div>
    </div>
  );
}
