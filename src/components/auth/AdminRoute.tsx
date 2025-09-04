import { useSession } from '@/contexts/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const AdminRoute = () => {
  const { profile, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Skeleton className="h-32 w-full max-w-lg" />
      </div>
    );
  }

  if (profile?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;