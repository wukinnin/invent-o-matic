import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const fetchSystemStats = async () => {
  const { count: totalTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true });

  const { count: activeTenants } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  return { totalTenants, activeTenants, totalUsers };
};

const StatCard = ({ title, value, isLoading }: { title: string; value: string | number | null; isLoading: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-medium text-gray-600">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <p className="text-4xl font-bold">{value}</p>
      )}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['systemStats'],
    queryFn: fetchSystemStats,
  });

  return (
    <div>
      <header className="pb-4 mb-8 border-b">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">A high-level overview of the entire system.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tenants" value={stats?.totalTenants ?? 0} isLoading={isLoading} />
        <StatCard title="Active Tenants" value={stats?.activeTenants ?? 0} isLoading={isLoading} />
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} isLoading={isLoading} />
        <Card>
          <CardHeader><CardTitle className="text-base font-medium text-gray-600">System Status</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-40" />
            ) : isError ? (
              <p className="text-4xl font-bold text-red-600">Error</p>
            ) : (
              <p className="text-4xl font-bold text-green-600">Operational</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;