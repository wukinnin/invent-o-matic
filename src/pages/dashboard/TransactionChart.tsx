import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { day: 'Mon', inbound: 60, outbound: 40 },
  { day: 'Tue', inbound: 80, outbound: 50 },
  { day: 'Wed', inbound: 70, outbound: 90 },
  { day: 'Thu', inbound: 65, outbound: 45 },
  { day: 'Fri', inbound: 95, outbound: 60 },
  { day: 'Sat', inbound: 50, outbound: 70 },
  { day: 'Sun', inbound: 75, outbound: 85 },
];

const TransactionChart = () => {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Transaction Flow (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="inbound" fill="#3B82F6" name="Inbound" />
            <Bar dataKey="outbound" fill="#EF4444" name="Outbound" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TransactionChart;