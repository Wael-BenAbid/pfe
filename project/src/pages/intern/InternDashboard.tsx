import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { LogOutIcon } from 'lucide-react';

const InternDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Intern Dashboard</h1>
            <div className="flex items-center">
              <div className="mr-4">
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<LogOutIcon className="h-4 w-4" />}
                onClick={handleLogout}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Intern Dashboard</h2>
            <p className="text-gray-600">
              This is a placeholder for the intern dashboard content. In a full implementation, this would contain intern-specific features like internship progress tracking, supervisor communication, and learning resources.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InternDashboard;