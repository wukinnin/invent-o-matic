import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TransactionData {
  date: string;
  inbound: number;
  outbound: number;
}

interface TransactionChartProps {
  data: TransactionData[] | undefined;
  isLoading: boolean;
}

export const TransactionChart = ({ data, isLoading }: TransactionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Flow (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="inbound" fill="#3B82F6" name="Inbound" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outbound" fill="#EF4444" name="Outbound" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};