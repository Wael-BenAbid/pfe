import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/constants";

interface AdminOverviewProps {
  pendingApplicationsCount: number;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({
  pendingApplicationsCount,
}) => {
  const { token } = useAuth();
  const [employeeCount, setEmployeeCount] = useState(0);
  const [internCount, setInternCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!token) return;

      try {
        // Fetch employees count
        const employeeResponse = await fetch(`${API_BASE_URL}/users/?user_type=employee`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();
          setEmployeeCount(employeeData.length);
        }

        // Fetch interns count
        const internResponse = await fetch(`${API_BASE_URL}/users/?user_type=intern`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (internResponse.ok) {
          const internData = await internResponse.json();
          setInternCount(internData.length);
        }
      } catch (error) {
        console.error("Error fetching user counts:", error);
      }
    };

    fetchCounts();
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Pending Applications */}
        <Link to="/admin/applications" className="group">
          <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <AlertCircleIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Applications
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {pendingApplicationsCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 px-5 py-3">
              <div className="text-sm">
                <div className="font-medium text-orange-700 hover:text-orange-900 flex justify-between items-center">
                  View all pending applications
                  <span>&rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Active Employees */}
        <Link to="/admin/employees?filter=employee" className="group">
          <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Employees
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {employeeCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 px-5 py-3">
              <div className="text-sm">
                <div className="font-medium text-blue-700 hover:text-blue-900 flex justify-between items-center">
                  Manage employees
                  <span>&rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Active Interns */}
        <Link to="/admin/interns" className="group">
          <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <GraduationCapIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Interns
                    </dt>
                    <dd>
                      <div className="text-lg font-semibold text-gray-900">
                        {internCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-green-50 px-5 py-3">
              <div className="text-sm">
                <div className="font-medium text-green-700 hover:text-green-900 flex justify-between items-center">
                  Manage interns
                  <span>&rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
        <ul className="divide-y divide-gray-200">
          <li>
            <Link to="/admin/applications" className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircleIcon className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Review pending applications
                    </p>
                    <p className="text-sm text-gray-500">
                      Review and approve job and internship applications
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
          <li>
            <Link to="/admin/employees" className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Manage users
                    </p>
                    <p className="text-sm text-gray-500">
                      View and manage all employees and interns
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminOverview;
