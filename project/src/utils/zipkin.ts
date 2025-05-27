// Configuration Zipkin avec fallback pour runtime
const getZipkinConfig = () => {
  // Par défaut, activer Zipkin
  let enabled = true;
  let url = '/zipkin'; // Utiliser le proxy par défaut

  // Essayer d'abord les variables d'environnement Vite (build time)
  if (import.meta.env.VITE_ZIPKIN_ENABLED !== undefined) {
    enabled = import.meta.env.VITE_ZIPKIN_ENABLED === 'true';
  }
  if (import.meta.env.VITE_ZIPKIN_URL) {
    url = import.meta.env.VITE_ZIPKIN_URL;
  }

  // Fallback pour runtime : lire depuis window.ENV si disponible
  if (typeof window !== 'undefined' && (window as any).ENV) {
    const env = (window as any).ENV;
    if (env.VITE_ZIPKIN_ENABLED !== undefined) {
      enabled = env.VITE_ZIPKIN_ENABLED === 'true';
    }
    if (env.VITE_ZIPKIN_URL) {
      url = env.VITE_ZIPKIN_URL;
    }
  }

  // Détecter l'environnement pour le fallback
  if (!url || url === '/zipkin') {
    if (window.location.port === '5175' || window.location.port === '80') {
      // Docker (port 5175 ou 80)
      url = '/zipkin';
    } else {
      // Local (port 5173 ou autre)
      url = 'http://localhost:9411';
    }
  }

  console.log('🔍 Configuration Zipkin:', { enabled, url });
  return { enabled, url };
};

const { enabled: zipkinEnabled, url: zipkinUrl } = getZipkinConfig();

// Génération d'ID aléatoires pour les traces (16 caractères hex)
const generateRandomId = () => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
};

// Contexte de trace actuel
let currentTraceId: string | null = null;
let currentSpanId: string | null = null;

// Fonction pour envoyer une trace à Zipkin
const sendSpan = async (span: any) => {
  if (!zipkinEnabled) return;

  try {
    // Construire l'URL complète avec /api/v2/spans
    const fullUrl = `${zipkinUrl}/api/v2/spans`;

    console.log(`Envoi de trace à Zipkin: ${fullUrl}`);
    console.log('Span:', JSON.stringify(span));

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([span])
    });

    console.log(`Réponse de Zipkin: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`Erreur lors de l'envoi de la trace à Zipkin: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la trace à Zipkin:', error);
  }
};

// Fonction pour créer un span
export const createSpan = async (name: string, callback: () => Promise<any>) => {
  if (!zipkinEnabled) {
    return callback();
  }

  const traceId = currentTraceId || generateRandomId();
  const parentId = currentSpanId;
  const spanId = generateRandomId();

  // Sauvegarder le contexte actuel
  currentTraceId = traceId;
  currentSpanId = spanId;

  const startTime = Date.now() * 1000; // Microsecondes

  try {
    const result = await callback();

    // Envoyer le span à Zipkin
    const endTime = Date.now() * 1000;
    const span = {
      traceId,
      id: spanId,
      name,
      parentId,
      timestamp: startTime,
      duration: endTime - startTime,
      kind: 'CLIENT',
      localEndpoint: {
        serviceName: 'rh-frontend'
      }
    };

    await sendSpan(span);

    return result;
  } catch (error) {
    // Envoyer le span d'erreur à Zipkin
    const endTime = Date.now() * 1000;
    const span = {
      traceId,
      id: spanId,
      name,
      parentId,
      timestamp: startTime,
      duration: endTime - startTime,
      kind: 'CLIENT',
      localEndpoint: {
        serviceName: 'rh-frontend'
      },
      tags: {
        error: error instanceof Error ? error.message : String(error)
      }
    };

    await sendSpan(span);

    throw error;
  } finally {
    // Restaurer le contexte parent
    currentTraceId = traceId;
    currentSpanId = parentId;
  }
};

// Fonction pour effectuer une requête HTTP avec traçage
export const tracedFetch = async (url: string, options: RequestInit = {}) => {
  if (!zipkinEnabled) {
    return window.fetch(url, options);
  }

  const traceId = currentTraceId || generateRandomId();
  const parentId = currentSpanId;
  const spanId = generateRandomId();

  // Ajouter les en-têtes de trace
  const headers = new Headers(options.headers || {});
  headers.set('X-B3-TraceId', traceId);
  headers.set('X-B3-SpanId', spanId);
  if (parentId) {
    headers.set('X-B3-ParentSpanId', parentId);
  }
  headers.set('X-B3-Sampled', '1');

  const startTime = Date.now() * 1000; // Microsecondes

  try {
    const response = await window.fetch(url, {
      ...options,
      headers
    });

    // Envoyer le span à Zipkin
    const endTime = Date.now() * 1000;
    const span = {
      traceId,
      id: spanId,
      name: `${options.method || 'GET'} ${new URL(url, window.location.origin).pathname}`,
      parentId,
      timestamp: startTime,
      duration: endTime - startTime,
      kind: 'CLIENT',
      localEndpoint: {
        serviceName: 'rh-frontend'
      },
      tags: {
        'http.method': options.method || 'GET',
        'http.path': new URL(url, window.location.origin).pathname,
        'http.status_code': response.status.toString()
      }
    };

    await sendSpan(span);

    return response;
  } catch (error) {
    // Envoyer le span d'erreur à Zipkin
    const endTime = Date.now() * 1000;
    const span = {
      traceId,
      id: spanId,
      name: `${options.method || 'GET'} ${new URL(url, window.location.origin).pathname}`,
      parentId,
      timestamp: startTime,
      duration: endTime - startTime,
      kind: 'CLIENT',
      localEndpoint: {
        serviceName: 'rh-frontend'
      },
      tags: {
        'http.method': options.method || 'GET',
        'http.path': new URL(url, window.location.origin).pathname,
        error: error instanceof Error ? error.message : String(error)
      }
    };

    await sendSpan(span);

    throw error;
  }
};

// Fonction pour initialiser Zipkin
export const initZipkin = () => {
  if (zipkinEnabled) {
    console.log('Zipkin tracing enabled');
    console.log(`Zipkin URL: ${zipkinUrl}`);
  } else {
    console.log('Zipkin tracing disabled');
  }
};

export default {
  initZipkin,
  createSpan,
  tracedFetch
};
