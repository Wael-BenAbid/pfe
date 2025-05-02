import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { CalendarIcon, MapPinIcon, UserIcon, LinkIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
import { format } from "date-fns";
import Button from "../../components/ui/Button";
import { API_BASE_URL } from "../../config/constants";

interface Meeting {
  id: number;
  title: string;
  description: string;
  date_time: string;
  duration_minutes: number;
  location_type: string;
  location_details: string;
  meeting_link: string;
  organizer: number;
  organizer_name: string;
  status: string;
}

const InternMeetings: React.FC = () => {
  const { token } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    if (token) {
      fetchMeetings();
    }
  }, [token]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/meetings/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      } else {
        throw new Error(`Failed to fetch meetings: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setError("Failed to load meetings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Filter meetings based on date
  const filteredMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.date_time);
    const now = new Date();

    if (filter === "upcoming") return meetingDate > now;
    if (filter === "past") return meetingDate < now;
    return true;
  });

  // Get location display based on meeting type
  const getLocationDisplay = (meeting: Meeting) => {
    switch (meeting.location_type) {
      case "online":
        return (
          <div className="flex items-center text-sm text-gray-500">
            <LinkIcon className="h-4 w-4 mr-2" />
            <a
              href={meeting.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Join Meeting
            </a>
          </div>
        );
      case "office":
        return (
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            Office: {meeting.location_details}
          </div>
        );
      case "external":
        return (
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            External Location: {meeting.location_details}
          </div>
        );
      default:
        return null;
    }
  };

  // Get status badge
  const getStatusBadge = (meeting: Meeting) => {
    const meetingDate = new Date(meeting.date_time);
    const now = new Date();

    if (meeting.status === "cancelled") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Cancelled
        </span>
      );
    }

    if (meeting.status === "completed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    }

    if (meetingDate < now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Past
        </span>
      );
    }

    // Calculate if the meeting is today
    const today = new Date();
    const isToday =
      meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear();

    if (isToday) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Today
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Upcoming
      </span>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2Icon className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading meetings...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => fetchMeetings()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">My Meetings</h2>
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "upcoming" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "past" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("past")}
          >
            Past
          </Button>
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No meetings found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all"
              ? "You don't have any meetings scheduled."
              : filter === "upcoming"
              ? "You don't have any upcoming meetings."
              : "You don't have any past meetings."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {meeting.title}
                  </h3>
                  {meeting.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {meeting.description}
                    </p>
                  )}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(new Date(meeting.date_time), "PPP")} at {format(new Date(meeting.date_time), "p")}
                      <span className="ml-2 text-gray-400">({meeting.duration_minutes} min)</span>
                    </div>
                    {getLocationDisplay(meeting)}
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Organized by: {meeting.organizer_name}
                    </div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(meeting)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternMeetings;
