
// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'admin' | 'employee' | 'intern';
  leave_balance: number;
  first_name: string;
  last_name: string;
  position: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Leave Types
export interface Leave {
  id: number;
  user: number;
  user_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CreateLeaveRequest {
  start_date: string;
  end_date: string;
  reason: string;
}

export interface UpdateLeaveRequest {
  start_date?: string;
  end_date?: string;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

// Mission Types
export interface Mission {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_to_name: string;
  supervisor: number;
  supervisor_name: string;
  deadline: string;
  completed: boolean;
  created_at: string;
}

export interface CreateMissionRequest {
  title: string;
  description: string;
  assigned_to: number;
  supervisor: number;
  deadline: string;
}

export interface UpdateMissionRequest {
  title?: string;
  description?: string;
  assigned_to?: number;
  supervisor?: number;
  deadline?: string;
  completed?: boolean;
}

// Work Hours Types
export interface WorkHours {
  id: number;
  user: number;
  user_name: string;
  date: string;
  hours_worked: number;
  created_at: string;
}

export interface CreateWorkHoursRequest {
  date: string;
  hours_worked: number;
  user?: number;
}

// Internship Types
export interface Internship {
  id: number;
  intern: number;
  intern_name: string;
  supervisor: number;
  supervisor_name: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'completed' | 'terminated';
  created_at: string;
}

export interface CreateInternshipRequest {
  intern: number;
  supervisor: number;
  start_date: string;
  end_date: string;
}

export interface UpdateInternshipRequest {
  intern?: number;
  supervisor?: number;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'active' | 'completed' | 'terminated';
}

// Job Application Types
export interface JobApplication {
  submitted_at: string | number | Date;
  id: number;
  user?: number;
  application_type: 'employee' | 'intern';
  position: string;
  first_name: string;
  last_name: string;
  username?: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  motivation: string;
  cv_file: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CreateJobApplicationRequest {
  application_type: 'employee' | 'intern';
  position: string;
  first_name: string;
  last_name: string;
  username?: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  motivation: string;
  cv_file: File;
}

export interface UpdateJobApplicationRequest {
  application_type?: 'employee' | 'intern';
  position?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experience?: string;
  motivation?: string;
  status?: 'pending' | 'approved' | 'rejected';
}
