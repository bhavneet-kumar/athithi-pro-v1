import { Home, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/crm' });
  }, [navigate]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='text-center'>
        <div className='flex justify-center mb-6'>
          <AlertTriangle className='h-24 w-24 text-red-500' />
        </div>
        <h1 className='text-6xl font-bold text-gray-900 mb-4'>404</h1>
        <h2 className='text-2xl font-semibold text-gray-700 mb-2'>
          Page Not Found
        </h2>
        <p className='text-gray-500 mb-8'>
          Sorry, the page you visited does not exist.
        </p>
        <Link to='/'>
          <button className='inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors'>
            <Home className='h-4 w-4' />
            Back Home
          </button>
        </Link>
      </div>
    </div>
  );
};
