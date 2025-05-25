/**
 * Hook personnalisé pour simplifier l'utilisation du tracing Zipkin
 */
import { useCallback } from 'react';
import {
  traceBusinessAction,
  traceUserAction,
  traceAuthentication,
  tracePageNavigation
} from '../services/zipkinService';

export const useZipkinTracing = () => {
  // Tracer les actions métier
  const traceBusiness = useCallback((
    actionType: 'mission' | 'leave' | 'meeting' | 'message' | 'user_management',
    operation: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject',
    entityId?: string,
    details?: Record<string, any>
  ) => {
    traceBusinessAction(actionType, operation, entityId, details);
  }, []);

  // Tracer les actions utilisateur
  const traceUser = useCallback((action: string, details?: Record<string, any>) => {
    traceUserAction(action, details);
  }, []);

  // Tracer l'authentification
  const traceAuth = useCallback((
    action: 'login' | 'logout' | 'register' | 'password_reset',
    success: boolean,
    userEmail?: string,
    errorMessage?: string
  ) => {
    traceAuthentication(action, success, userEmail, errorMessage);
  }, []);

  // Tracer la navigation
  const traceNavigation = useCallback((pageName: string, route: string) => {
    tracePageNavigation(pageName, route);
  }, []);

  // Fonctions spécialisées pour les missions
  const traceMission = {
    create: useCallback((missionId: string, details?: Record<string, any>) =>
      traceBusinessAction('mission', 'create', missionId, details), []),

    update: useCallback((missionId: string, details?: Record<string, any>) =>
      traceBusinessAction('mission', 'update', missionId, details), []),

    delete: useCallback((missionId: string, details?: Record<string, any>) =>
      traceBusinessAction('mission', 'delete', missionId, details), []),

    view: useCallback((missionId: string, details?: Record<string, any>) =>
      traceBusinessAction('mission', 'view', missionId, details), []),

    complete: useCallback((missionId: string, details?: Record<string, any>) =>
      traceBusinessAction('mission', 'approve', missionId, details), []),
  };

  // Fonctions spécialisées pour les congés
  const traceLeave = {
    create: useCallback((leaveId: string, details?: Record<string, any>) =>
      traceBusinessAction('leave', 'create', leaveId, details), []),

    update: useCallback((leaveId: string, details?: Record<string, any>) =>
      traceBusinessAction('leave', 'update', leaveId, details), []),

    approve: useCallback((leaveId: string, details?: Record<string, any>) =>
      traceBusinessAction('leave', 'approve', leaveId, details), []),

    reject: useCallback((leaveId: string, details?: Record<string, any>) =>
      traceBusinessAction('leave', 'reject', leaveId, details), []),

    view: useCallback((leaveId: string, details?: Record<string, any>) =>
      traceBusinessAction('leave', 'view', leaveId, details), []),
  };

  // Fonctions spécialisées pour les réunions
  const traceMeeting = {
    create: useCallback((meetingId: string, details?: Record<string, any>) =>
      traceBusinessAction('meeting', 'create', meetingId, details), []),

    update: useCallback((meetingId: string, details?: Record<string, any>) =>
      traceBusinessAction('meeting', 'update', meetingId, details), []),

    delete: useCallback((meetingId: string, details?: Record<string, any>) =>
      traceBusinessAction('meeting', 'delete', meetingId, details), []),

    view: useCallback((meetingId: string, details?: Record<string, any>) =>
      traceBusinessAction('meeting', 'view', meetingId, details), []),
  };

  // Fonctions spécialisées pour les messages
  const traceMessage = {
    create: useCallback((messageId: string, details?: Record<string, any>) =>
      traceBusinessAction('message', 'create', messageId, details), []),

    view: useCallback((messageId: string, details?: Record<string, any>) =>
      traceBusinessAction('message', 'view', messageId, details), []),

    delete: useCallback((messageId: string, details?: Record<string, any>) =>
      traceBusinessAction('message', 'delete', messageId, details), []),
  };

  // Fonctions spécialisées pour la gestion des utilisateurs
  const traceUserManagement = {
    create: useCallback((userId: string, details?: Record<string, any>) =>
      traceBusinessAction('user_management', 'create', userId, details), []),

    update: useCallback((userId: string, details?: Record<string, any>) =>
      traceBusinessAction('user_management', 'update', userId, details), []),

    delete: useCallback((userId: string, details?: Record<string, any>) =>
      traceBusinessAction('user_management', 'delete', userId, details), []),

    view: useCallback((userId: string, details?: Record<string, any>) =>
      traceBusinessAction('user_management', 'view', userId, details), []),

    approve: useCallback((userId: string, details?: Record<string, any>) =>
      traceBusinessAction('user_management', 'approve', userId, details), []),

    reject: useCallback((userId: string, details?: Record<string, any>) =>
      traceBusinessAction('user_management', 'reject', userId, details), []),
  };

  return {
    // Fonctions génériques
    traceBusiness,
    traceUser,
    traceAuth,
    traceNavigation,

    // Fonctions spécialisées
    traceMission,
    traceLeave,
    traceMeeting,
    traceMessage,
    traceUserManagement,
  };
};

export default useZipkinTracing;
