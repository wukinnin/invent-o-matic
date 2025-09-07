import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const InactiveUserPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-yellow-100 rounded-full p-3 w-fit">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="mt-4">Account Inactive</CardTitle>
          <CardDescription>
            Your account has been made inactive by a manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            You no longer have access to the system. If you believe this is a mistake, please contact your department manager or a system administrator.
          </p>
          <Button asChild className="w-full">
            <Link to="/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InactiveUserPage;