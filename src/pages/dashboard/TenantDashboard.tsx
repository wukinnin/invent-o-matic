import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";

const TenantDashboard = () => {
  const { profile, signOut } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to Invent O'Matic</h1>
        {profile ? (
          <p className="text-xl text-gray-600">
            Hello, {profile.first_name || profile.school_id}!
          </p>
        ) : (
          <p className="text-xl text-gray-600">Loading your profile...</p>
        )}
        <Button onClick={signOut} className="mt-6">
          Sign Out
        </Button>
      </div>
      <div className="absolute bottom-0">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default TenantDashboard;