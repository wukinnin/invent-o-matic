import KpiCard from './dashboard/KpiCard';
import TransactionChart from './dashboard/TransactionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';

const forecastData = [
  { name: 'Band-Aids (Box)', stock: 80, forecast: 55, variance: 25 },
  { name: 'Alcohol (Liter)', stock: 15, forecast: 40, variance: -25 },
  { name: 'Syringes (Units)', stock: 550, forecast: 500, variance: 50 },
];

const lowStockData = [
    { name: 'Alcohol (Liter)', level: '15/20' },
    { name: 'Gauze Pads', level: '22/25' },
    { name: 'Pain Relievers', level: '50/50' },
    { name: 'Medical Tape', level: '12/10' },
    { name: 'Antiseptic Wipes', level: '105/100' },
];

const Dashboard = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Items in Stock" metric="1,420" />
        <Link to="/inventory?filter=low-stock">
          <KpiCard title="Items Below Minimum Level" metric="8" className="text-red-600" />
        </Link>
        <KpiCard title="Transactions (Last 30 Days)" metric="215" />
        <KpiCard title="Inventory Turnover Rate" metric="1.15" />

        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>30-Day Demand Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Forecasted Demand</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{item.forecast}</TableCell>
                    <TableCell className={item.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.variance > 0 ? `+${item.variance} (Surplus)` : `${item.variance} (Deficit)`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Top 5 Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {lowStockData.map(item => (
                        <li key={item.name} className="flex justify-between border-b pb-2 text-sm">
                            <span>{item.name}</span>
                            <span>{item.level}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>

        <TransactionChart />
      </div>
    </div>
  );
};

export default Dashboard;