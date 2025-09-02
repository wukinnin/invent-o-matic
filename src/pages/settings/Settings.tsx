import { useSession } from '@/contexts/SessionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { TenantSettings } from '@/components/settings/TenantSettings';

const SettingsPage = () => {
  const { profile } = useSession();
  const isManager = profile?.role === 'MANAGER';

  return (
    <div>
      <header className="pb-4 mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your profile and tenant settings.</p>
      </header>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          {isManager && <TabsTrigger value="tenant">Tenant Settings</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="profile" className="pt-6">
          <div className="space-y-8">
            <ProfileSettings />
            <SecuritySettings />
          </div>
        </TabsContent>
        
        {isManager && (
          <TabsContent value="tenant" className="pt-6">
            <TenantSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;