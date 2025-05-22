import {
  User,
  Leave,
  Mission,
  WorkHours,
  Internship,
  JobApplication,
  CreateLeaveRequest,
  CreateMissionRequest,
  CreateWorkHoursRequest,
  CreateInternshipRequest,
  CreateJobApplicationRequest,
  UpdateLeaveRequest,
  UpdateMissionRequest,
  UpdateInternshipRequest,
  UpdateJobApplicationRequest
} from '../types';
import tracedApi from '../utils/tracedApi';

const API_URL = '';

// User API
export const getUsers = async (): Promise<User[]> => {
  const response = await tracedApi.get<User[]>(`${API_URL}/users/`);
  return response;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await tracedApi.get<User>(`${API_URL}/users/${id}/`);
  return response;
};

// Leave API
export const getLeaves = async (): Promise<Leave[]> => {
  const response = await tracedApi.get<Leave[]>(`${API_URL}/leaves/`);
  return response;
};

export const getLeaveById = async (id: number): Promise<Leave> => {
  const response = await tracedApi.get<Leave>(`${API_URL}/leaves/${id}/`);
  return response;
};

export const createLeave = async (leaveData: CreateLeaveRequest): Promise<Leave> => {
  const response = await tracedApi.post<Leave>(`${API_URL}/leaves/`, leaveData);
  return response;
};

export const updateLeave = async (id: number, leaveData: UpdateLeaveRequest): Promise<Leave> => {
  const response = await tracedApi.put<Leave>(`${API_URL}/leaves/${id}/`, leaveData);
  return response;
};

export const approveLeave = async (id: number): Promise<Leave> => {
  const response = await tracedApi.post<Leave>(`${API_URL}/leaves/${id}/approve_leave/`, {});
  return response;
};

export const rejectLeave = async (id: number): Promise<Leave> => {
  const response = await tracedApi.post<Leave>(`${API_URL}/leaves/${id}/reject_leave/`, {});
  return response;
};

// Mission API
export const getMissions = async (): Promise<Mission[]> => {
  const response = await tracedApi.get<Mission[]>(`${API_URL}/missions/`);
  return response;
};

export const getMissionById = async (id: number): Promise<Mission> => {
  const response = await tracedApi.get<Mission>(`${API_URL}/missions/${id}/`);
  return response;
};

export const createMission = async (missionData: CreateMissionRequest): Promise<Mission> => {
  const response = await tracedApi.post<Mission>(`${API_URL}/missions/`, missionData);
  return response;
};

export const updateMission = async (id: number, missionData: UpdateMissionRequest): Promise<Mission> => {
  const response = await tracedApi.put<Mission>(`${API_URL}/missions/${id}/`, missionData);
  return response;
};

export const completeMission = async (id: number): Promise<Mission> => {
  const response = await tracedApi.post<Mission>(`${API_URL}/missions/${id}/complete_mission/`, {});
  return response;
};

// Work Hours API
export const getWorkHours = async (): Promise<WorkHours[]> => {
  const response = await tracedApi.get<WorkHours[]>(`${API_URL}/work-hours/`);
  return response;
};

export const createWorkHours = async (workHoursData: CreateWorkHoursRequest): Promise<WorkHours> => {
  const response = await tracedApi.post<WorkHours>(`${API_URL}/work-hours/`, workHoursData);
  return response;
};

// Internship API
export const getInternships = async (): Promise<Internship[]> => {
  const response = await tracedApi.get<Internship[]>(`${API_URL}/internships/`);
  return response;
};

export const getInternshipById = async (id: number): Promise<Internship> => {
  const response = await tracedApi.get<Internship>(`${API_URL}/internships/${id}/`);
  return response;
};

export const createInternship = async (internshipData: CreateInternshipRequest): Promise<Internship> => {
  const response = await tracedApi.post<Internship>(`${API_URL}/internships/`, internshipData);
  return response;
};

export const updateInternship = async (id: number, internshipData: UpdateInternshipRequest): Promise<Internship> => {
  const response = await tracedApi.put<Internship>(`${API_URL}/internships/${id}/`, internshipData);
  return response;
};

export const changeInternshipStatus = async (id: number, status: string): Promise<Internship> => {
  const response = await tracedApi.post<Internship>(`${API_URL}/internships/${id}/change_status/`, { status });
  return response;
};

// Job Application API
export const getJobApplications = async (): Promise<JobApplication[]> => {
  try {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`
    };
    const response = await tracedApi.get<JobApplication[]>(`${API_URL}/job-applications/`, { headers });
    console.log('API Response:', response); // Vérifiez les données ici
    return response;
  } catch (error) {
    console.error('Error fetching job applications:', error); // Log en cas d'erreur
    throw error;
  }
};

export const getJobApplicationById = async (id: number): Promise<JobApplication> => {
  const response = await tracedApi.get<JobApplication>(`${API_URL}/job-applications/${id}/`);
  return response;
};

export const createJobApplication = async (applicationData: CreateJobApplicationRequest): Promise<JobApplication> => {
  const response = await tracedApi.post<JobApplication>(`${API_URL}/job-applications/`, applicationData);
  return response;
};

export const updateJobApplication = async (id: number, applicationData: UpdateJobApplicationRequest): Promise<JobApplication> => {
  const response = await tracedApi.put<JobApplication>(`${API_URL}/job-applications/${id}/`, applicationData);
  return response;
};

export const approveJobApplication = async (id: number): Promise<JobApplication> => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`
  };
  const response = await tracedApi.post<JobApplication>(`${API_URL}/job-applications/${id}/approve/`, null, { headers });
  return response;
};

export const rejectJobApplication = async (id: number): Promise<JobApplication> => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`
  };
  const response = await tracedApi.post<JobApplication>(`${API_URL}/job-applications/${id}/reject/`, null, { headers });
  return response;
};
