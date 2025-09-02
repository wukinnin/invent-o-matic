import { NavLink } from 'react-router-dom';
import { Home, Package, Users, Truck, Settings, BarChart3 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

const navLinks = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/transactions', label: 'Transactions', icon: BarChart3 },
];

const managerLinks = [
  { to: '/users', label: 'User Management', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const { profile } = useSession();

  return (
    <aside className="hidden w-64 flex-col bg-gray-800 text-white md:flex">
      <div className="p-4 text-2xl font-bold">Invent O'Matic</div>
      <nav className="flex-1 space-y-2 p-2">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Icon className="mr-3 h-5 w-5" />
            {label}
          </NavLink>
        ))}
        {profile?.is_manager && managerLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-gray-900 text-white'
                  ...
              }`
            }
          >
            <Icon className="mr-3 h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;