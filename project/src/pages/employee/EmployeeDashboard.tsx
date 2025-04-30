import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { LogOutIcon, CalendarIcon, BriefcaseIcon, GraduationCapIcon, ClockIcon } from 'lucide-react';
import LeaveRequests from './LeaveRequests';
import Missions from './Missions';
import SupervisedInterns from './SupervisedInterns';
import WorkHours from './WorkHours';

const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // 👇 Simple useEffect usage to avoid ESLint warning
  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
  }, [activeTab]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'leave', label: 'Leave Requests', icon: CalendarIcon },
              { id: 'missions', label: 'Missions', icon: BriefcaseIcon },
              { id: 'interns', label: 'Supervised Interns', icon: GraduationCapIcon },
              { id: 'hours', label: 'Work Hours', icon: ClockIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <CalendarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">Leave Balance</h3>
                      <p className="text-2xl font-semibold text-gray-700">
                        {user?.leave_balance} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'leave' && <LeaveRequests />}
          {activeTab === 'missions' && <Missions />}
          {activeTab === 'interns' && <SupervisedInterns />}
          {activeTab === 'hours' && <WorkHours />}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
// Note: The above code is a simplified version of the Employee Dashboard component.