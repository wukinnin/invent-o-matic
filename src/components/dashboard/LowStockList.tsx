import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LowStockItem {
  name: string;
  current_stock: number;
  minimum_level: number;
}

interface LowStockListProps {
  data: LowStockItem[] | undefined;
  isLoading: boolean;
}

export const LowStockList = ({ data, isLoading }: LowStockListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Low Stock Items</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <li key={i}><Skeleton className="h-5 w-full" /></li>
            ))
          ) : data && data.length > 0 ? (
            data.map((item) => (
              <li key={item.name} className="text-sm flex justify-between border-b pb-2">
                <span>{item.name}</span>
                <span className="font-semibold">{item.current_stock} / {item.minimum_level}</span>
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center">No items are currently low on stock.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};