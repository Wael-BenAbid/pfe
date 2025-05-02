import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { TextInput } from '../../components/ui/FormElements';
import { ClockIcon, PlusIcon } from 'lucide-react';

interface WorkHour {
  id: number;
  date: string;
  hours_worked: number;
  description?: string;
  created_at: string;
  user: number;
}

const WorkHours: React.FC = () => {
  const { token } = useAuth();
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: '',
    hours_worked: 0, // Use a number here instead of a string
    description: ''
  });

  useEffect(() => {
    fetchWorkHours();
  }, [token]);

  const fetchWorkHours = async () => {
    setLoading(true);  // Start loading
    try {
      const response = await fetch(`${API_BASE_URL}/work-hours/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkHours(data);
      }
    } catch (error) {
      console.error('Error fetching work hours:', error);
    } finally {
      setLoading(false);  // End loading
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/work-hours/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newEntry,
          hours_worked: newEntry.hours_worked // No need for parseFloat here since it's already a number
        })
      });

      if (response.ok) {
        fetchWorkHours();
        setShowNewEntryForm(false);
        setNewEntry({ date: '', hours_worked: 0, description: '' }); // Reset state
      }
    } catch (error) {
      console.error('Error submitting work hours:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Work Hours</h2>
          <p className="text-sm text-gray-500">Your work hours are automatically tracked from login to logout</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowNewEntryForm(true)}
        >
          Add Manual Entry
        </Button>
      </div>

      {/* Form for adding a new entry */}
      {showNewEntryForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">New Work Hours Entry</h3>
          <form onSubmit={handleSubmitEntry} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                type="date"
                label="Date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                required
              />
              <TextInput
                type="number"
                label="Hours"
                value={newEntry.hours_worked}
                onChange={(e) => setNewEntry({ ...newEntry, hours_worked: parseFloat(e.target.value) })} // Parse as number
                required
                min="0"
                step="0.5"
              />
            </div>
            <TextInput
              label="Description"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              required
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewEntryForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
              >
                Submit Entry
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {workHours.map((entry) => (
              <li key={entry.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.description ? entry.description : 'No description'}
                        {entry.description && entry.description.includes('Automatic time tracking') && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Auto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {entry.hours_worked} hours
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkHours;