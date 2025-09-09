import { LocationsManager } from '@/components/settings/LocationsManager';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const LocationsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/settings">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
        </Button>
      </div>
      <header className="flex justify-between items-center pb-4 mb-8 border-b">
        <div>
          <h1 className="text-3xl font-bold">Locations Management</h1>
          <p className="text-gray-600 mt-1">Create, manage, and archive specific labs or areas within your tenant.</p>
        </div>
      </header>
      <LocationsManager />
    </div>
  );
};

export default LocationsPage;