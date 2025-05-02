import React from "react";
import { CalendarIcon, MapPinIcon, UserIcon } from "lucide-react";
import { format } from "date-fns";

// Mock data for meetings - In a real app, this would come from the API
const meetings = [
  {
    id: 1,
    title: "Weekly Progress Review",
    date: new Date("2024-03-20T10:00:00"),
    location: "Meeting Room 1",
    supervisor: "John Doe",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Project Presentation",
    date: new Date("2024-03-22T14:00:00"),
    location: "Conference Room",
    supervisor: "Jane Smith",
    status: "upcoming",
  },
];

const InternMeetings: React.FC = () => {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Scheduled Meetings
      </h2>

      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {meeting.title}
                </h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(meeting.date, "PPP")} at {format(meeting.date, "p")}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {meeting.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {meeting.supervisor}
                  </div>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Upcoming
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternMeetings;
