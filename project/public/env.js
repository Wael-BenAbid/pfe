// Configuration d'environnement pour l'application RH
window.ENV = {
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000' 
    : window.location.hostname.includes('rh-system.local')
    ? 'https://rh-system.local'
    : 'http://rh-backend:8000',
  
  ZIPKIN_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:9411'
    : window.location.hostname.includes('rh-system.local')
    ? 'https://zipkin.rh-system.local'
    : 'http://zipkin:9411',
    
  ZIPKIN_ENABLED: true,
  NODE_ENV: 'production'
};
