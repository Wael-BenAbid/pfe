import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { TextInput } from '../../components/ui/FormElements';
import { CalendarIcon, PlusIcon } from 'lucide-react';

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface NewLeaveRequest {
  start_date: string;
  end_date: string;
  reason: string;
}

const LeaveRequests: React.FC = () => {
  const { token } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState<NewLeaveRequest>({
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    if (token) fetchLeaveRequests();
  }, [token]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      } else {
        console.warn('Failed to fetch leave requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        await fetchLeaveRequests();
        setShowNewRequestForm(false);
        setNewRequest({ start_date: '', end_date: '', reason: '' });
      } else {
        console.warn('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return <span className={`${baseClass} bg-green-100 text-green-800`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseClass} bg-red-100 text-red-800`}>Rejected</span>;
      default:
        return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>Pending</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Leave Requests</h2>
        <Button
          variant="primary"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowNewRequestForm(true)}
        >
          New Request
        </Button>
      </div>

      {showNewRequestForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">New Leave Request</h3>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                type="date"
                label="Start Date"
                value={newRequest.start_date}
                onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                required
              />
              <TextInput
                type="date"
                label="End Date"
                value={newRequest.end_date}
                onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                required
              />
            </div>
            <TextInput
              label="Reason"
              value={newRequest.reason}
              onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
              required
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowNewRequestForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      )}

      {!loading && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {leaveRequests.map((request) => (
              <li key={request.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{request.reason}</div>
                    </div>
                  </div>
                  <div className="ml-4">{getStatusBadge(request.status)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <p className="text-gray-500">Loading leave requests...</p>}
    </div>
  );
};

export default LeaveRequests;
