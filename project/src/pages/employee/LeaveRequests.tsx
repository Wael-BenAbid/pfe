import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { CalendarIcon, PlusIcon, ClockIcon } from "lucide-react";

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface NewLeaveRequest {
  start_date: string;
  end_date: string;
  reason: string;
}

const LeaveRequests: React.FC = () => {
  const { token, user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState<NewLeaveRequest>({
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [leaveBalance, setLeaveBalance] = useState<number>(0);

  useEffect(() => {
    if (token) {
      fetchLeaveRequests();
      fetchUserDetails();
    }
  }, [token]);

  const fetchUserDetails = async () => {
    if (!token || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setLeaveBalance(userData.leave_balance);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      } else {
        console.warn("Failed to fetch leave requests:", response.status);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRequest),
      });

      if (response.ok) {
        await fetchLeaveRequests();
        setShowNewRequestForm(false);
        setNewRequest({ start_date: "", end_date: "", reason: "" });
      } else {
        console.warn("Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    const baseClass =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "approved":
        return (
          <span className={`${baseClass} bg-green-100 text-green-800`}>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClass} bg-red-100 text-red-800`}>
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Leave Requests</h2>
          <p className="text-sm text-gray-500">
            Your current leave balance:{" "}
            <span className="font-medium text-blue-600">
              {leaveBalance} days
            </span>
          </p>
        </div>
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
        <div className="mb-6 bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              New Leave Request
            </h3>
            <Button
              variant="outline"
              size="sm"
              icon={<ClockIcon className="h-4 w-4" />}
            >
              {newRequest.start_date && newRequest.end_date
                ? `${calculateDays(
                    newRequest.start_date,
                    newRequest.end_date
                  )} days`
                : "Select dates"}
            </Button>
          </div>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                name="start_date"
                type="date"
                label="Start Date"
                value={newRequest.start_date}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, start_date: e.target.value })
                }
                required
              />
              <TextInput
                name="End_date"
                type="date"
                label="End Date"
                value={newRequest.end_date}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, end_date: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label
                htmlFor="leave-reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reason
              </label>
              <textarea
                id="leave-reason"
                name="reason"
                aria-label="Reason for leave"
                placeholder="Please provide a reason for your leave request"
                value={newRequest.reason}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, reason: e.target.value })
                }
                rows={3}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewRequestForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={
                  !newRequest.start_date ||
                  !newRequest.end_date ||
                  !newRequest.reason
                }
              >
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading leave requests..." />
      ) : leaveRequests.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No leave requests
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new leave request.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Days
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reason
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(request.start_date).toLocaleDateString()} -{" "}
                        {new Date(request.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateDays(request.start_date, request.end_date)} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
