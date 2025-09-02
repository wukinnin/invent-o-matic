import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { ForecastTable } from '@/components/dashboard/ForecastTable';
import { LowStockList } from '@/components/dashboard/LowStockList';
import { TransactionChart } from '@/components/dashboard/TransactionChart';
import { Skeleton } from '@/components/ui/skeleton';

const fetchDashboardData = async (tenantId: number) => {
  if (!tenantId) return null;

  const { data, error } = await supabase.rpc('get_tenant_dashboard_stats', {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(error.message);
  return data;
};

const Dashboard = () => {
  const { profile } = useSession();
  // DEV NOTE: Bypassing auth, hardcoding tenant_id to 1 for development.
  // This should be replaced with the logged-in user's tenant_id.
  const tenantId = profile?.tenant_id || 1;

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData', tenantId],
    queryFn: () => fetchDashboardData(tenantId!),
    enabled: !!tenantId,
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </header>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items in Stock"
          value={data?.total_items ?? 0}
          isLoading={isLoading}
        />
        <StatCard
          title="Items Below Minimum"
          value={data?.low_stock_count ?? 0}
          isLoading={isLoading}
          valueColor={data?.low_stock_count > 0 ? 'text-red-600' : ''}
          linkTo="#" // Placeholder for inventory page link
        />
        <StatCard
          title="Transactions (30 Days)"
          value={data?.transactions_30_days ?? 0}
          isLoading={isLoading}
        />
        <StatCard
          title="Inventory Turnover"
          value={data?.turnover_rate?.toFixed(2) ?? 'N/A'}
          isLoading={isLoading}
        />

        <div className="lg:col-span-4">
          <ForecastTable data={data?.forecasts} isLoading={isLoading} />
        </div>

        <div className="lg:col-span-2">
          <LowStockList data={data?.low_stock_items} isLoading={isLoading} />
        </div>
        
        <div className="lg:col-span-2">
          <TransactionChart data={data?.weekly_transactions} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;