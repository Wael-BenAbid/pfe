import axios from 'axios';
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

const API_URL = '/api';

// User API
export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get<User[]>(`${API_URL}/users/`);
  return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await axios.get<User>(`${API_URL}/users/${id}/`);
  return response.data;
};

// Leave API
export const getLeaves = async (): Promise<Leave[]> => {
  const response = await axios.get<Leave[]>(`${API_URL}/leaves/`);
  return response.data;
};

export const getLeaveById = async (id: number): Promise<Leave> => {
  const response = await axios.get<Leave>(`${API_URL}/leaves/${id}/`);
  return response.data;
};

export const createLeave = async (leaveData: CreateLeaveRequest): Promise<Leave> => {
  const response = await axios.post<Leave>(`${API_URL}/leaves/`, leaveData);
  return response.data;
};

export const updateLeave = async (id: number, leaveData: UpdateLeaveRequest): Promise<Leave> => {
  const response = await axios.patch<Leave>(`${API_URL}/leaves/${id}/`, leaveData);
  return response.data;
};

export const approveLeave = async (id: number): Promise<Leave> => {
  const response = await axios.post<Leave>(`${API_URL}/leaves/${id}/approve_leave/`, {});
  return response.data;
};

export const rejectLeave = async (id: number): Promise<Leave> => {
  const response = await axios.post<Leave>(`${API_URL}/leaves/${id}/reject_leave/`, {});
  return response.data;
};

// Mission API
export const getMissions = async (): Promise<Mission[]> => {
  const response = await axios.get<Mission[]>(`${API_URL}/missions/`);
  return response.data;
};

export const getMissionById = async (id: number): Promise<Mission> => {
  const response = await axios.get<Mission>(`${API_URL}/missions/${id}/`);
  return response.data;
};

export const createMission = async (missionData: CreateMissionRequest): Promise<Mission> => {
  const response = await axios.post<Mission>(`${API_URL}/missions/`, missionData);
  return response.data;
};

export const updateMission = async (id: number, missionData: UpdateMissionRequest): Promise<Mission> => {
  const response = await axios.patch<Mission>(`${API_URL}/missions/${id}/`, missionData);
  return response.data;
};

export const completeMission = async (id: number): Promise<Mission> => {
  const response = await axios.post<Mission>(`${API_URL}/missions/${id}/complete_mission/`, {});
  return response.data;
};

// Work Hours API
export const getWorkHours = async (): Promise<WorkHours[]> => {
  const response = await axios.get<WorkHours[]>(`${API_URL}/work-hours/`);
  return response.data;
};

export const createWorkHours = async (workHoursData: CreateWorkHoursRequest): Promise<WorkHours> => {
  const response = await axios.post<WorkHours>(`${API_URL}/work-hours/`, workHoursData);
  return response.data;
};

// Internship API
export const getInternships = async (): Promise<Internship[]> => {
  const response = await axios.get<Internship[]>(`${API_URL}/internships/`);
  return response.data;
};

export const getInternshipById = async (id: number): Promise<Internship> => {
  const response = await axios.get<Internship>(`${API_URL}/internships/${id}/`);
  return response.data;
};

export const createInternship = async (internshipData: CreateInternshipRequest): Promise<Internship> => {
  const response = await axios.post<Internship>(`${API_URL}/internships/`, internshipData);
  return response.data;
};

export const updateInternship = async (id: number, internshipData: UpdateInternshipRequest): Promise<Internship> => {
  const response = await axios.patch<Internship>(`${API_URL}/internships/${id}/`, internshipData);
  return response.data;
};

export const changeInternshipStatus = async (id: number, status: string): Promise<Internship> => {
  const response = await axios.post<Internship>(`${API_URL}/internships/${id}/change_status/`, { status });
  return response.data;
};

// Job Application API
export const getJobApplications = async (): Promise<JobApplication[]> => {
  try {
    const response = await axios.get(`${API_URL}/job-applications/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    console.log('API Response:', response.data); // Vérifiez les données ici
    return response.data;
  } catch (error) {
    console.error('Error fetching job applications:', error); // Log en cas d'erreur
    throw error;
  }
};

export const getJobApplicationById = async (id: number): Promise<JobApplication> => {
  const response = await axios.get<JobApplication>(`${API_URL}/job-applications/${id}/`);
  return response.data;
};

export const createJobApplication = async (applicationData: CreateJobApplicationRequest): Promise<JobApplication> => {
  const response = await axios.post<JobApplication>(`${API_URL}/job-applications/`, applicationData);
  return response.data;
};

export const updateJobApplication = async (id: number, applicationData: UpdateJobApplicationRequest): Promise<JobApplication> => {
  const response = await axios.patch<JobApplication>(`${API_URL}/job-applications/${id}/`, applicationData);
  return response.data;
};

export const approveJobApplication = async (id: number): Promise<JobApplication> => {
  const response = await axios.post<JobApplication>(`/api/job-applications/${id}/approve/`, null, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.data; // Retournez l'objet JobApplication
};

export const rejectJobApplication = async (id: number): Promise<JobApplication> => {
  const response = await axios.post<JobApplication>(`/api/job-applications/${id}/reject/`, null, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.data; // Retournez l'objet JobApplication
};
