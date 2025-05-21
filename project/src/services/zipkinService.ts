import { Tracer, ExplicitContext, BatchRecorder } from 'zipkin';
import { HttpLogger } from 'zipkin-transport-http';
import axios from 'axios';
import { wrapAxios } from 'zipkin-instrumentation-axios';

// Récupérer l'URL du serveur Zipkin depuis les variables d'environnement
const ZIPKIN_URL = import.meta.env.VITE_ZIPKIN_URL || 'http://zipkin.rh-system.local:9411';
const SERVICE_NAME = 'rh-frontend';

// Créer un contexte explicite pour stocker les informations de trace
const ctxImpl = new ExplicitContext();

// Créer un enregistreur qui envoie les données à Zipkin
const recorder = new BatchRecorder({
  logger: new HttpLogger({
    endpoint: `${ZIPKIN_URL}/v2/spans`,
    jsonEncoder: JSON,
  }),
});

// Créer un traceur Zipkin
export const tracer = new Tracer({
  ctxImpl,
  recorder,
  localServiceName: SERVICE_NAME,
  sampler: () => true, // Échantillonner toutes les requêtes
});

// Créer une instance axios instrumentée avec Zipkin
export const zipkinAxios = wrapAxios(axios, { tracer, serviceName: SERVICE_NAME });

// Fonction pour créer un span
export const createSpan = (name: string) => {
  return tracer.createChildId();
};

// Fonction pour enregistrer une opération
export const recordOperation = (name: string, callback: () => void) => {
  tracer.local(name, callback);
};

// Fonction pour enregistrer une opération asynchrone
export const recordAsyncOperation = async (name: string, callback: () => Promise<any>) => {
  return tracer.local(name, callback);
};

export default {
  tracer,
  zipkinAxios,
  createSpan,
  recordOperation,
  recordAsyncOperation,
};
