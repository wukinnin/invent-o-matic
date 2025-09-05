import { AdminProfileSettings } from '@/components/admin/AdminProfileSettings';
import { AdminSecuritySettings } from '@/components/admin/AdminSecuritySettings';

const AdminSettingsPage = () => {
  return (
    <div>
      <header className="pb-4 mb-6">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
      </header>

      <div className="space-y-8">
        <AdminProfileSettings />
        <AdminSecuritySettings />
      </div>
    </div>
  );
};

export default AdminSettingsPage;