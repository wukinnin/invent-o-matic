import { useLocation } from 'react-router-dom';

const Placeholder = () => {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').replace('-', ' ');

  return (
    <div className="flex h-full items-center justify-center rounded-lg bg-white p-8 shadow">
      <div className="text-center">
        <h1 className="text-3xl font-bold capitalize">{pageName}</h1>
        <p className="mt-4 text-gray-600">This page is under construction.</p>
      </div>
    </div>
  );
};

export default Placeholder;