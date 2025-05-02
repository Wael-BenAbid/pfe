/**
 * This file is deprecated. Please use the queries.ts file in the lib directory instead.
 * @deprecated Use ../queries.ts instead
 */

import { storage } from '../../server/storage';
import { queryClient } from '../queryClient';
import {
  type InsertLeave,
  type InsertMission,
  type InsertWorkHours,
  type InsertInternship,
  type InsertJobApplication
} from '../../shared/schema';

// Re-export from queries.ts
export * from '../queries';

// These functions are kept for backward compatibility
// but will be removed in a future version

// Mutations with proper typing
export const createLeaveMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (leave: InsertLeave) => storage.createLeave(leave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

export const createMissionMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (mission: InsertMission) => storage.createMission(mission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
};

export const createWorkHoursMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (workHours: InsertWorkHours) => storage.createWorkHours(workHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workHours'] });
    },
  });
};

export const createInternshipMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (internship: InsertInternship) => storage.createInternship(internship),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internships'] });
    },
  });
};

export const createJobApplicationMutation = () => {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn: (application: InsertJobApplication) => storage.createJobApplication(application),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    },
  });
};