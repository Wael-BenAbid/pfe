/**
 * Service Zipkin simplifié pour le tracing distribué dans le frontend
 * Version compatible navigateur sans dépendances Node.js
 */
import axios from 'axios';

// Interface pour les spans Zipkin
interface ZipkinSpan {
  traceId: string;
  id: string;
  name: string;
  timestamp: number;
  duration?: number;
  localEndpoint: {
    serviceName: string;
  };
  remoteEndpoint?: {
    serviceName: string;
  };
  tags?: Record<string, string>;
  annotations?: Array<{
    timestamp: number;
    value: string;
  }>;
}

// Configuration des URLs Zipkin depuis les variables d'environnement
const getZipkinUrl = (): string => {
  // Utiliser les variables d'environnement injectées au runtime
  if (typeof window !== 'undefined' && (window as any).ENV) {
    const zipkinUrl = (window as any).ENV.VITE_ZIPKIN_URL;
    if (zipkinUrl) {
      // Si c'est un chemin relatif, construire l'URL complète
      if (zipkinUrl.startsWith('/')) {
        return `${window.location.origin}${zipkinUrl}`;
      }
      return zipkinUrl;
    }
  }

  // Fallback : détecter si on est en Docker ou en local
  // En Docker, utiliser le proxy nginx, en local utiliser localhost:9411
  if (window.location.port === '5175' || window.location.port === '80') {
    // Docker (port 5175 ou 80)
    return '/zipkin';
  } else {
    // Local (port 5173 ou autre)
    return 'http://localhost:9411';
  }
};

const SERVICE_NAME = 'rh-frontend';
const ZIPKIN_URL = getZipkinUrl();

// Générateur d'IDs uniques (16 caractères hex pour Zipkin)
const generateId = (): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
};

// Classe pour gérer les spans
class SimpleSpan {
  public traceId: string;
  public id: string;
  public name: string;
  public timestamp: number;
  public tags: Record<string, string> = {};
  public finished: boolean = false;

  constructor(name: string, traceId?: string) {
    this.traceId = traceId || generateId();
    this.id = generateId();
    this.name = name;
    this.timestamp = Date.now() * 1000; // Microseconds
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  finish(): void {
    if (this.finished) return;
    this.finished = true;

    const span: ZipkinSpan = {
      traceId: this.traceId,
      id: this.id,
      name: this.name,
      timestamp: this.timestamp,
      duration: (Date.now() * 1000) - this.timestamp,
      localEndpoint: {
        serviceName: SERVICE_NAME,
      },
      tags: this.tags,
    };

    // Envoyer le span à Zipkin
    sendSpanToZipkin(span);
  }
}

// Fonction pour envoyer les spans à Zipkin
const sendSpanToZipkin = async (span: ZipkinSpan): Promise<void> => {
  try {
    await fetch(`${ZIPKIN_URL}/api/v2/spans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([span]),
    });
    console.log('✅ Span envoyé à Zipkin:', span.name);
  } catch (error) {
    console.warn('⚠️ Erreur lors de l\'envoi du span à Zipkin:', error);
  }
};

// Instrumentation d'Axios
const originalAxios = axios.create();
const instrumentedAxios = axios.create();

// Intercepteur pour les requêtes
instrumentedAxios.interceptors.request.use((config) => {
  const span = new SimpleSpan(`HTTP ${config.method?.toUpperCase()} ${config.url}`);
  span.setTag('http.method', config.method?.toUpperCase() || 'GET');
  span.setTag('http.url', config.url || '');
  span.setTag('component', 'axios');

  // Stocker le span dans la config pour le récupérer dans la réponse
  (config as any)._zipkinSpan = span;

  return config;
});

// Intercepteur pour les réponses
instrumentedAxios.interceptors.response.use(
  (response) => {
    const span = (response.config as any)._zipkinSpan;
    if (span) {
      span.setTag('http.status_code', response.status.toString());
      span.finish();
    }
    return response;
  },
  (error) => {
    const span = (error.config as any)?._zipkinSpan;
    if (span) {
      span.setTag('error', 'true');
      span.setTag('http.status_code', error.response?.status?.toString() || '0');
      span.finish();
    }
    return Promise.reject(error);
  }
);

export const zipkinAxios = instrumentedAxios;

// Fonctions utilitaires pour récupérer les informations utilisateur
const getUserInfo = () => {
  try {
    // Essayer d'abord 'user_data' (utilisé par AuthContext)
    let userStr = localStorage.getItem('user_data');

    // Fallback vers 'user' si 'user_data' n'existe pas
    if (!userStr) {
      userStr = localStorage.getItem('user');
    }

    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('📊 Données utilisateur récupérées pour Zipkin:', user);

      return {
        id: user.id?.toString() || 'unknown',
        email: user.email || 'unknown',
        role: user.user_type || user.role || 'unknown',
        name: user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'unknown',
      };
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors de la récupération des informations utilisateur pour Zipkin:', error);
  }

  console.log('⚠️ Aucune donnée utilisateur trouvée, utilisation de valeurs anonymes');
  return {
    id: 'anonymous',
    email: 'anonymous',
    role: 'anonymous',
    name: 'anonymous',
  };
};

const getSessionId = (): string => {
  try {
    let sessionId = localStorage.getItem('zipkin_session_id');
    if (!sessionId) {
      sessionId = generateId();
      localStorage.setItem('zipkin_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    return generateId();
  }
};

// Fonctions utilitaires
export const createSpan = (name: string, tags?: Record<string, any>): SimpleSpan => {
  const span = new SimpleSpan(name);

  if (tags) {
    Object.entries(tags).forEach(([key, value]) => {
      span.setTag(key, String(value));
    });
  }

  return span;
};

export const finishSpan = (span: SimpleSpan, success: boolean = true): void => {
  if (!span || span.finished) return;

  if (!success) {
    span.setTag('error', 'true');
  }

  span.finish();
};

export const recordOperation = (name: string, callback: () => void): void => {
  const span = createSpan(name);
  try {
    callback();
    finishSpan(span, true);
  } catch (error) {
    finishSpan(span, false);
    throw error;
  }
};

export const recordAsyncOperation = async (name: string, callback: () => Promise<any>): Promise<any> => {
  const span = createSpan(name);
  try {
    const result = await callback();
    finishSpan(span, true);
    return result;
  } catch (error) {
    finishSpan(span, false);
    throw error;
  }
};

// Tracer une navigation de page
export const tracePageNavigation = (pageName: string, route: string): void => {
  const span = createSpan('page_navigation', {
    'page.name': pageName,
    'page.route': route,
    'page.url': window.location.href,
  });
  finishSpan(span, true);
};

// Tracer une action utilisateur avec contexte complet
export const traceUserAction = (action: string, details?: Record<string, any>): void => {
  // Récupérer les informations utilisateur depuis le localStorage
  const userInfo = getUserInfo();

  const span = createSpan('user_action', {
    'action.name': action,
    'action.timestamp': new Date().toISOString(),
    'user.id': userInfo.id,
    'user.email': userInfo.email,
    'user.role': userInfo.role,
    'user.name': userInfo.name,
    'session.id': getSessionId(),
    ...details,
  });
  finishSpan(span, true);
};

// Tracer une action métier spécifique
export const traceBusinessAction = (
  actionType: 'mission' | 'leave' | 'meeting' | 'message' | 'user_management',
  operation: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject',
  entityId?: string,
  details?: Record<string, any>
): void => {
  const userInfo = getUserInfo();

  const span = createSpan(`business_action_${actionType}_${operation}`, {
    'business.action_type': actionType,
    'business.operation': operation,
    'business.entity_id': entityId || 'unknown',
    'user.id': userInfo.id,
    'user.email': userInfo.email,
    'user.role': userInfo.role,
    'user.name': userInfo.name,
    'session.id': getSessionId(),
    'timestamp': new Date().toISOString(),
    ...details,
  });
  finishSpan(span, true);
};

// Tracer une authentification
export const traceAuthentication = (
  action: 'login' | 'logout' | 'register' | 'password_reset',
  success: boolean,
  userEmail?: string,
  errorMessage?: string
): void => {
  const span = createSpan(`auth_${action}`, {
    'auth.action': action,
    'auth.success': success.toString(),
    'auth.user_email': userEmail || 'unknown',
    'auth.error': errorMessage || '',
    'session.id': getSessionId(),
    'timestamp': new Date().toISOString(),
  });
  finishSpan(span, success);
};

// Configuration et debug
export const getZipkinConfig = () => ({
  serviceName: SERVICE_NAME,
  zipkinUrl: ZIPKIN_URL,
  endpoint: `${ZIPKIN_URL}/api/v2/spans`,
});

console.log('✅ Zipkin configuré:', getZipkinConfig());

export default {
  zipkinAxios,
  createSpan,
  finishSpan,
  recordOperation,
  recordAsyncOperation,
  tracePageNavigation,
  traceUserAction,
  traceBusinessAction,
  traceAuthentication,
  getZipkinConfig,
};
