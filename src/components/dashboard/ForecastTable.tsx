import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Forecast {
  item_name: string;
  current_stock: number;
  forecasted_demand: number;
}

interface ForecastTableProps {
  data: Forecast[] | undefined;
  isLoading: boolean;
}

export const ForecastTable = ({ data, isLoading }: ForecastTableProps) => {
  const renderVariance = (stock: number, demand: number) => {
    const variance = stock - demand;
    const text = variance >= 0 ? `+${variance} (Surplus)` : `${variance} (Deficit)`;
    const color = variance >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={`font-semibold ${color}`}>{text}</span>;
  };

  return (
    <Card>
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
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.item_name}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell>{item.current_stock}</TableCell>
                  <TableCell>{item.forecasted_demand}</TableCell>
                  <TableCell>{renderVariance(item.current_stock, item.forecasted_demand)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No forecast data available.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};