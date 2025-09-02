import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  metric: string;
  className?: string;
}

const KpiCard = ({ title, metric, className }: KpiCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-4xl font-bold', className)}>{metric}</p>
      </CardContent>
    </Card>
  );
};

export default KpiCard;