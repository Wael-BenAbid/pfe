import React from 'react';
import DeadlineCalendar from '../../components/calendar/DeadlineCalendar';

const CalendarView: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Deadlines & Meetings Calendar
      </h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <DeadlineCalendar />
      </div>
    </div>
  );
};

export default CalendarView;
