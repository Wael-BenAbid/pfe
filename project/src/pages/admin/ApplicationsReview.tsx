import React, { useState, useEffect } from 'react';
import { API_BASE_URL, APPLICATION_STATUSES } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FileTextIcon, CheckIcon, XIcon, EyeIcon } from 'lucide-react';

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  application_type: string;
  position: string;
  education: string;
  experience: string;
  motivation: string;
  status: string;
  created_at: string;
  cv_file: string;
}

const ApplicationsReview: React.FC = () => {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  useEffect(() => {
    fetchApplications();
  }, [token, filter]);
  
  const fetchApplications = async () => {
    if (!token) return;
    
    try {
      let url = `${API_BASE_URL}/job-applications/`;
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateApplicationStatus = async (id: number, status: string) => {
    if (!token) return;
    
    setProcessingId(id);
    
    try {
      const response = await fetch(`${API_BASE_URL}/job-applications/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application status');
      }
      
      // Refresh the applications list
      fetchApplications();
      
      // If the updated application is the selected one, update it
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case APPLICATION_STATUSES.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case APPLICATION_STATUSES.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case APPLICATION_STATUSES.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };
  
  const getApplicationTypeBadge = (type: string) => {
    switch (type) {
      case 'employee':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Job
          </span>
        );
      case 'intern':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Internship
          </span>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading applications..." />;
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Applications Review</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">
              All Applications
            </h2>
            <div className="flex space-x-2">
              <Button 
                variant={filter === 'all' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={filter === 'pending' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button 
                variant={filter === 'approved' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('approved')}
              >
                Approved
              </Button>
              <Button 
                variant={filter === 'rejected' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </div>
        
        {applications.length === 0 ? (
          <div className="p-6 text-center">
            <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'There are no applications in the system yet.' 
                : `No ${filter} applications found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-800 font-semibold">
                            {app.first_name.charAt(0)}{app.last_name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {app.first_name} {app.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {app.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getApplicationTypeBadge(app.application_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedApplication(app)}
                        icon={<EyeIcon className="h-4 w-4" />}
                      >
                        View
                      </Button>
                      {app.status === APPLICATION_STATUSES.PENDING && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            className="ml-2"
                            onClick={() => updateApplicationStatus(app.id, APPLICATION_STATUSES.APPROVED)}
                            icon={<CheckIcon className="h-4 w-4" />}
                            isLoading={processingId === app.id}
                            disabled={processingId !== null}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="ml-2"
                            onClick={() => updateApplicationStatus(app.id, APPLICATION_STATUSES.REJECTED)}
                            icon={<XIcon className="h-4 w-4" />}
                            isLoading={processingId === app.id}
                            disabled={processingId !== null}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => setSelectedApplication(null)}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Application Details
                      </h3>
                      <div className="flex items-center">
                        {getApplicationTypeBadge(selectedApplication.application_type)}
                        <div className="ml-2">
                          {getStatusBadge(selectedApplication.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {selectedApplication.first_name} {selectedApplication.last_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Position</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {selectedApplication.position}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {selectedApplication.email}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {selectedApplication.phone}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Education</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                            {selectedApplication.education}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Experience</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                            {selectedApplication.experience || 'No experience provided'}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Motivation</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                            {selectedApplication.motivation}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Resume/CV</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <a 
                              href={selectedApplication.cv_file} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Download CV
                            </a>
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Application Date</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(selectedApplication.created_at)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedApplication.status === APPLICATION_STATUSES.PENDING && (
                  <>
                    <Button
                      variant="success"
                      className="w-full sm:w-auto sm:ml-3"
                      onClick={() => updateApplicationStatus(selectedApplication.id, APPLICATION_STATUSES.APPROVED)}
                      icon={<CheckIcon className="h-4 w-4" />}
                      isLoading={processingId === selectedApplication.id}
                      disabled={processingId !== null}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="mt-3 w-full sm:mt-0 sm:w-auto sm:ml-3"
                      onClick={() => updateApplicationStatus(selectedApplication.id, APPLICATION_STATUSES.REJECTED)}
                      icon={<XIcon className="h-4 w-4" />}
                      isLoading={processingId === selectedApplication.id}
                      disabled={processingId !== null}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsReview;