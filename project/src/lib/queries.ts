/**
 * Data fetching and mutation functions for the application
 * This file centralizes all data access through React Query
 *
 * IMPORTANT: These functions return Promises, not React Query hooks.
 * To use them in React components, you need to:
 *
 * 1. Call them and then use the result in a useEffect hook
 * 2. Store the result in state using useState
 *
 * Example:
 * ```tsx
 * const [missions, setMissions] = useState([]);
 *
 * useEffect(() => {
 *   const fetchData = async () => {
 *     const result = await useMissions(userId, 'assignee');
 *     setMissions(result);
 *   };
 *   fetchData();
 * }, [userId]);
 * ```
 *
 * Alternatively, you can use a library like react-query directly in your components.
 */

import { storage } from '../server/storage';
import { queryClient } from './queryClient';
import {
  type InsertLeave,
  type InsertMission,
  type InsertWorkHours,
  type InsertInternship,
  type InsertJobApplication
} from '../shared/schema';

/**
 * User related queries
 */

/**
 * Fetch a user by ID
 * @param id User ID
 * @returns User data or undefined if not found
 */
export const useUser = (id: number) => {
  return queryClient.fetchQuery({
    queryKey: ['user', id],
    queryFn: () => storage.getUser(id)
  });
};

/**
 * Fetch a user by username
 * @param username Username to search for
 * @returns User data or undefined if not found
 */
export const useUserByUsername = (username: string) => {
  return queryClient.fetchQuery({
    queryKey: ['user', username],
    queryFn: () => storage.getUserByUsername(username)
  });
};

// Leave related queries
export const useLeaves = (userId?: number) => {
  return queryClient.fetchQuery({
    queryKey: ['leaves', userId],
    queryFn: () => userId ? storage.getLeavesByUser(userId) : storage.getAllLeaves()
  });
};

export const useLeave = (id: number) => {
  return queryClient.fetchQuery({
    queryKey: ['leave', id],
    queryFn: () => storage.getLeave(id)
  });
};

/**
 * Mission related queries
 */

/**
 * Fetch missions with optional filtering by user and role
 * @param userId Optional user ID to filter by
 * @param type Optional role type (assignee or supervisor)
 * @returns List of missions
 */
export const useMissions = (userId?: number, type?: 'assignee' | 'supervisor') => {
  return queryClient.fetchQuery({
    queryKey: ['missions', userId, type],
    queryFn: () => {
      if (!userId) return storage.getAllMissions();
      if (type === 'assignee') return storage.getMissionsByAssignee(userId);
      if (type === 'supervisor') return storage.getMissionsBySupervisor(userId);
      return storage.getAllMissions();
    }
  });
};

/**
 * Fetch a single mission by ID
 * @param id Mission ID
 * @returns Mission data or undefined if not found
 */
export const useMission = (id: number) => {
  return queryClient.fetchQuery({
    queryKey: ['mission', id],
    queryFn: () => storage.getMission(id)
  });
};

/**
 * Work Hours related queries
 */

/**
 * Fetch work hours with optional filtering by user
 * @param userId Optional user ID to filter by
 * @returns List of work hours
 */
export const useWorkHours = (userId?: number) => {
  return queryClient.fetchQuery({
    queryKey: ['workHours', userId],
    queryFn: () => userId ? storage.getWorkHoursByUser(userId) : storage.getAllWorkHours()
  });
};

/**
 * Internship related queries
 */

/**
 * Fetch internships with optional filtering by user and role
 * @param userId Optional user ID to filter by
 * @param type Optional role type (intern or supervisor)
 * @returns List of internships
 */
export const useInternships = (userId?: number, type?: 'intern' | 'supervisor') => {
  return queryClient.fetchQuery({
    queryKey: ['internships', userId, type],
    queryFn: () => {
      if (!userId) return storage.getAllInternships();
      if (type === 'intern') return storage.getInternshipsByIntern(userId);
      if (type === 'supervisor') return storage.getInternshipsBySupervisor(userId);
      return storage.getAllInternships();
    }
  });
};

/**
 * Fetch a single internship by ID
 * @param id Internship ID
 * @returns Internship data or undefined if not found
 */
export const useInternship = (id: number) => {
  return queryClient.fetchQuery({
    queryKey: ['internship', id],
    queryFn: () => storage.getInternship(id)
  });
};

/**
 * Job Application related queries
 */

/**
 * Fetch job applications with optional filtering by user
 * @param userId Optional user ID to filter by
 * @returns List of job applications
 */
export const useJobApplications = (userId?: number) => {
  return queryClient.fetchQuery({
    queryKey: ['jobApplications', userId],
    queryFn: () => userId ? storage.getJobApplicationsByUser(userId) : storage.getAllJobApplications()
  });
};

/**
 * Fetch a single job application by ID
 * @param id Job application ID
 * @returns Job application data or undefined if not found
 */
export const useJobApplication = (id: number) => {
  return queryClient.fetchQuery({
    queryKey: ['jobApplication', id],
    queryFn: () => storage.getJobApplication(id)
  });
};

/**
 * Mutations for creating and updating data
 */

/**
 * Create a new leave request
 * @returns Mutation for creating a leave request
 */
export const createLeaveMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (leave: InsertLeave) => storage.createLeave(leave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

/**
 * Create a new mission
 * @returns Mutation for creating a mission
 */
export const createMissionMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (mission: InsertMission) => storage.createMission(mission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
};

/**
 * Create a new work hours record
 * @returns Mutation for creating work hours
 */
export const createWorkHoursMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (workHours: InsertWorkHours) => storage.createWorkHours(workHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workHours'] });
    },
  });
};

/**
 * Create a new internship
 * @returns Mutation for creating an internship
 */
export const createInternshipMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (internship: InsertInternship) => storage.createInternship(internship),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internships'] });
    },
  });
};

/**
 * Create a new job application
 * @returns Mutation for creating a job application
 */
export const createJobApplicationMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (application: InsertJobApplication) => storage.createJobApplication(application),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    },
  });
};

/**
 * Approve a leave request
 * @returns Mutation for approving a leave request
 */
export const approveLeaveRequestMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (leaveId: number) => storage.approveLeave(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

/**
 * Reject a leave request
 * @returns Mutation for rejecting a leave request
 */
export const rejectLeaveRequestMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (leaveId: number) => storage.rejectLeave(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

/**
 * Complete a mission
 * @returns Mutation for marking a mission as complete
 */
export const completeMissionMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (missionId: number) => storage.completeMission(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
};

/**
 * Change internship status
 * @returns Mutation for changing an internship status
 */
export const changeInternshipStatusMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      storage.changeInternshipStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internships'] });
    },
  });
};
