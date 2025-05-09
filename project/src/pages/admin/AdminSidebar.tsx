import React from "react";
import { NavLink } from "react-router-dom";
import {
  X as XIcon,
  Home as HomeIcon,
  Users as UsersIcon,
  FileText as FileTextIcon,
  Briefcase as BriefcaseIcon,
  GraduationCap as GraduationCapIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
} from "lucide-react";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  pendingApplicationsCount: number;
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  open,
  onClose,
  pendingApplicationsCount,
}) => {
  const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    {
      name: "Applications",
      href: "/admin/applications",
      icon: FileTextIcon,
      badge:
        pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined,
    },
    { name: "Employees", href: "/admin/employees", icon: UsersIcon },
    { name: "Interns", href: "/admin/interns", icon: UsersIcon },
    { name: "Missions", href: "/admin/missions", icon: BriefcaseIcon },
    {
      name: "Internships",
      href: "/admin/internships",
      icon: GraduationCapIcon,
    },
    { name: "Leave Requests", href: "/admin/leaves", icon: CalendarIcon },
    { name: "My Profile", href: "/admin/profile", icon: UserIcon },
  ];

  const renderNavLinks = () => {
    return navigation.map((item) => (
      <NavLink
        key={item.name}
        to={item.href}
        className={({ isActive }) => `
          ${
            isActive
              ? "bg-blue-800 text-white"
              : "text-blue-100 hover:bg-blue-700"
          }
          group flex items-center px-2 py-2 text-base font-medium rounded-md
        `}
        end
      >
        <item.icon className="mr-4 flex-shrink-0 h-6 w-6" aria-hidden="true" />
        {item.name}
        {item.badge && (
          <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
            {item.badge}
          </span>
        )}
      </NavLink>
    ));
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 lg:hidden ${
          open ? "block" : "hidden"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-900 transition-all transform">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-white">HR Admin</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">{renderNavLinks()}</nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-blue-900">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-white">HR Admin</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">{renderNavLinks()}</nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
