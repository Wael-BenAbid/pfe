/**
 * Email service for sending notifications
 * This is a mock implementation that would be replaced with a real email service in production
 */

/**
 * Send an email to a recipient
 * @param to Email address of the recipient
 * @param subject Subject of the email
 * @param body Body content of the email
 * @returns Promise that resolves when the email is sent
 */
export const sendEmail = async (to: string, subject: string, body: string): Promise<{ success: boolean }> => {
  // In a real implementation, this would use an email service like SendGrid, Mailgun, etc.
  console.log(`Sending email to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);

  // Simulate email sending with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1000);
  });
};

/**
 * Send a notification about a new mission assignment
 * @param email Email address of the recipient
 * @param mission Mission details
 * @returns Promise that resolves when the email is sent
 */
export const sendMissionNotification = async (email: string, mission: {
  title: string;
  description: string;
  deadline: Date | string;
  id: number;
  assigned_by?: string;
}): Promise<{ success: boolean }> => {
  const subject = `New Mission Assignment: ${mission.title}`;
  const body = `
    You have been assigned a new mission:

    Title: ${mission.title}
    Description: ${mission.description}
    Deadline: ${new Date(mission.deadline).toLocaleDateString()}
    Mission ID: ${mission.id}
    ${mission.assigned_by ? `Assigned by: ${mission.assigned_by}` : ''}

    Please log in to your dashboard to view more details.
  `;

  return sendEmail(email, subject, body);
};

/**
 * Send a reminder about an upcoming mission deadline
 * @param email Email address of the recipient
 * @param mission Mission details
 * @returns Promise that resolves when the email is sent
 */
export const sendDeadlineReminder = async (email: string, mission: {
  title: string;
  deadline: Date | string;
  id: number;
  daysRemaining?: number;
}): Promise<{ success: boolean }> => {
  const subject = `Deadline Reminder: ${mission.title}`;
  const body = `
    This is a reminder about your upcoming deadline:

    Mission: ${mission.title}
    Deadline: ${new Date(mission.deadline).toLocaleDateString()}
    Mission ID: ${mission.id}
    ${mission.daysRemaining ? `Days remaining: ${mission.daysRemaining}` : ''}

    Please ensure to complete and submit your work before the deadline.
  `;

  return sendEmail(email, subject, body);
};

/**
 * Send a meeting invitation request
 * @param email Email address of the recipient
 * @param meeting Meeting details
 * @returns Promise that resolves when the email is sent
 */
export const sendMeetingRequest = async (email: string, meeting: {
  title: string;
  date: Date | string;
  location: string;
  id: number;
  organizer?: string;
  description?: string;
  participants?: string[];
}): Promise<{ success: boolean }> => {
  const subject = `Meeting Request: ${meeting.title}`;
  const body = `
    You have been invited to a meeting:

    Title: ${meeting.title}
    Date: ${new Date(meeting.date).toLocaleDateString()}
    Time: ${new Date(meeting.date).toLocaleTimeString()}
    Location: ${meeting.location}
    Meeting ID: ${meeting.id}
    ${meeting.organizer ? `Organizer: ${meeting.organizer}` : ''}
    ${meeting.description ? `\nDescription: ${meeting.description}` : ''}
    ${meeting.participants && meeting.participants.length > 0
      ? `\nParticipants: ${meeting.participants.join(', ')}`
      : ''}

    Please confirm your attendance through the dashboard.
  `;

  return sendEmail(email, subject, body);
};

/**
 * Send an internship application confirmation
 * @param email Email address of the recipient
 * @param internship Internship details
 * @returns Promise that resolves when the email is sent
 */
export const sendInternshipConfirmation = async (email: string, internship: {
  title: string;
  department: string;
  start_date: Date | string;
  end_date: Date | string;
  id: number;
  supervisor_name?: string;
}): Promise<{ success: boolean }> => {
  const subject = `Internship Application Confirmation: ${internship.title}`;
  const body = `
    Your internship application has been received:

    Title: ${internship.title}
    Department: ${internship.department}
    Period: ${new Date(internship.start_date).toLocaleDateString()} - ${new Date(internship.end_date).toLocaleDateString()}
    Internship ID: ${internship.id}
    ${internship.supervisor_name ? `Supervisor: ${internship.supervisor_name}` : ''}

    We will review your application and get back to you soon.
  `;

  return sendEmail(email, subject, body);
};