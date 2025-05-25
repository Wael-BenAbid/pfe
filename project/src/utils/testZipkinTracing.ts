/**
 * Script de test pour vérifier le tracing Zipkin
 */
import {
  traceBusinessAction,
  traceUserAction,
  traceAuthentication,
  tracePageNavigation,
  getZipkinConfig
} from '../services/zipkinService';

export const testZipkinTracing = () => {
  console.log('🧪 Test du tracing Zipkin...');
  console.log('Configuration Zipkin:', getZipkinConfig());

  // Test 0: Vérifier les données utilisateur dans localStorage
  console.log('📝 Test 0: Vérification des données utilisateur');
  console.log('user_data:', localStorage.getItem('user_data'));
  console.log('user:', localStorage.getItem('user'));
  console.log('access_token:', localStorage.getItem('access_token') ? 'Présent' : 'Absent');
  console.log('session_id:', localStorage.getItem('session_id'));

  // Test 1: Authentification
  console.log('📝 Test 1: Tracing d\'authentification');
  traceAuthentication('login', true, 'test@example.com');

  // Test 2: Navigation de page
  console.log('📝 Test 2: Tracing de navigation');
  tracePageNavigation('Test Page', '/test');

  // Test 3: Action utilisateur
  console.log('📝 Test 3: Tracing d\'action utilisateur');
  traceUserAction('button_click', {
    'button.name': 'test_button',
    'page.name': 'test_page',
  });

  // Test 4: Actions métier - Mission
  console.log('📝 Test 4: Tracing d\'actions métier - Mission');
  traceBusinessAction('mission', 'create', 'test-mission-1', {
    'mission.title': 'Mission de test',
    'mission.assigned_to': 'user-123',
    'mission.deadline': '2024-12-31',
  });

  traceBusinessAction('mission', 'view', 'test-mission-1', {
    'mission.title': 'Mission de test',
    'mission.status': 'pending',
  });

  traceBusinessAction('mission', 'update', 'test-mission-1', {
    'mission.title': 'Mission de test modifiée',
    'mission.status': 'in_progress',
  });

  // Test 5: Actions métier - Congé
  console.log('📝 Test 5: Tracing d\'actions métier - Congé');
  traceBusinessAction('leave', 'create', 'test-leave-1', {
    'leave.type': 'vacation',
    'leave.start_date': '2024-06-01',
    'leave.end_date': '2024-06-07',
    'leave.days': '5',
  });

  traceBusinessAction('leave', 'approve', 'test-leave-1', {
    'leave.approved_by': 'admin-456',
    'leave.approval_date': new Date().toISOString(),
  });

  // Test 6: Actions métier - Réunion
  console.log('📝 Test 6: Tracing d\'actions métier - Réunion');
  traceBusinessAction('meeting', 'create', 'test-meeting-1', {
    'meeting.title': 'Réunion de test',
    'meeting.date': '2024-06-15',
    'meeting.participants': '3',
  });

  // Test 7: Actions métier - Message
  console.log('📝 Test 7: Tracing d\'actions métier - Message');
  traceBusinessAction('message', 'create', 'test-message-1', {
    'message.recipient': 'user-789',
    'message.subject': 'Message de test',
    'message.has_attachment': 'false',
  });

  // Test 8: Gestion des utilisateurs
  console.log('📝 Test 8: Tracing de gestion des utilisateurs');
  traceBusinessAction('user_management', 'approve', 'test-user-1', {
    'user.email': 'newuser@example.com',
    'user.role': 'employee',
    'approval.date': new Date().toISOString(),
  });

  // Test 9: Erreurs
  console.log('📝 Test 9: Tracing d\'erreurs');
  traceBusinessAction('mission', 'create', undefined, {
    'mission.title': 'Mission échouée',
    'error': 'Validation failed: deadline is required',
  });

  console.log('✅ Tests de tracing terminés!');
  console.log('🔍 Vérifiez Zipkin UI pour voir les traces:');
  console.log(`   - Local: http://localhost:9411`);
  console.log(`   - Kubernetes: https://zipkin.rh-system.local`);
  console.log('🔎 Recherchez le service "rh-frontend" dans Zipkin');
};

// Fonction pour tester le tracing en continu
export const startContinuousTracing = (intervalMs: number = 10000) => {
  console.log(`🔄 Démarrage du tracing continu (intervalle: ${intervalMs}ms)`);

  let counter = 0;
  const interval = setInterval(() => {
    counter++;

    // Simuler différentes actions
    const actions = [
      () => traceUserAction('periodic_action', { 'counter': counter.toString() }),
      () => traceBusinessAction('mission', 'view', `mission-${counter}`, { 'auto_generated': 'true' }),
      () => tracePageNavigation(`Auto Page ${counter}`, `/auto/${counter}`),
    ];

    // Exécuter une action aléatoire
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();

    console.log(`📊 Trace automatique #${counter} envoyée`);

    // Arrêter après 10 traces
    if (counter >= 10) {
      clearInterval(interval);
      console.log('🛑 Tracing continu arrêté');
    }
  }, intervalMs);

  return interval;
};

// Fonction pour tester la performance du tracing
export const testTracingPerformance = async () => {
  console.log('⚡ Test de performance du tracing...');

  const startTime = performance.now();
  const numTraces = 100;

  for (let i = 0; i < numTraces; i++) {
    traceUserAction(`performance_test_${i}`, {
      'test.iteration': i.toString(),
      'test.timestamp': Date.now().toString(),
    });
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`📈 Performance du tracing:`);
  console.log(`   - ${numTraces} traces créées en ${duration.toFixed(2)}ms`);
  console.log(`   - Moyenne: ${(duration / numTraces).toFixed(2)}ms par trace`);
  console.log(`   - Débit: ${(numTraces / (duration / 1000)).toFixed(2)} traces/seconde`);
};

// Export pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
  (window as any).testZipkinTracing = testZipkinTracing;
  (window as any).startContinuousTracing = startContinuousTracing;
  (window as any).testTracingPerformance = testTracingPerformance;
}
