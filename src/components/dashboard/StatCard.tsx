import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  isLoading: boolean;
  linkTo?: string;
  valueColor?: string;
}

export const StatCard = ({ title, value, isLoading, linkTo, valueColor }: StatCardProps) => {
  const content = (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={cn("text-3xl font-bold", valueColor)}>{value}</div>
        )}
      </CardContent>
    </Card>
  );

  if (linkTo) {
    return <Link to={linkTo} className="hover:opacity-90 transition-opacity">{content}</Link>;
  }

  return content;
};