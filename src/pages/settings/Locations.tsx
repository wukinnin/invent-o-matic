import { LocationsManager } from '@/components/settings/LocationsManager';

const LocationsPage = () => {
  return (
    <div>
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