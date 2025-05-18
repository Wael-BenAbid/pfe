/**
 * Script pour remplacer les alertes par des modales dans tous les fichiers du projet
 *
 * Ce script génère les commandes à exécuter pour remplacer les alertes par des modales
 * dans tous les fichiers du projet.
 *
 * Instructions:
 * 1. Ajouter l'import AlertModal dans chaque fichier
 * 2. Ajouter l'état alertModal
 * 3. Remplacer les appels à alert() par des appels à setAlertModal()
 * 4. Ajouter le composant AlertModal dans le JSX
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Liste des fichiers à modifier
const filesToModify = [
  'src/pages/admin/InternshipManagement.tsx',
  'src/pages/admin/MissionManagement.tsx',
  'src/pages/admin/UserManagement.tsx',
  'src/pages/employee/InternManagement.tsx',
  'src/pages/employee/InternMissionManagement.tsx',
  'src/pages/employee/LeaveRequests.tsx',
  'src/pages/intern/InternMissions.tsx',
  'src/pages/ApplicationForm.tsx'
];

// Fonction pour lire le contenu d'un fichier
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Fonction pour écrire dans un fichier
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fonction pour ajouter l'import AlertModal
function addAlertModalImport(content) {
  // Vérifier si l'import existe déjà
  if (content.includes('import AlertModal from')) {
    return content;
  }

  // Trouver la dernière ligne d'import
  const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
  const lastImportLine = importLines[importLines.length - 1];
  const lastImportIndex = content.indexOf(lastImportLine) + lastImportLine.length;

  // Ajouter l'import AlertModal après la dernière ligne d'import
  return content.slice(0, lastImportIndex) +
    '\nimport AlertModal from "../../components/ui/AlertModal";' +
    content.slice(lastImportIndex);
}

// Fonction pour ajouter l'état alertModal
function addAlertModalState(content) {
  // Vérifier si l'état existe déjà
  if (content.includes('alertModal')) {
    return content;
  }

  // Trouver la dernière déclaration d'état
  const stateLines = content.split('\n').filter(line => line.trim().includes('useState'));
  const lastStateLine = stateLines[stateLines.length - 1];
  const lastStateIndex = content.indexOf(lastStateLine) + lastStateLine.length;

  // Ajouter l'état alertModal après la dernière déclaration d'état
  return content.slice(0, lastStateIndex) +
    '\n  const [alertModal, setAlertModal] = useState({\n' +
    '    isOpen: false,\n' +
    '    title: \'\',\n' +
    '    message: \'\',\n' +
    '    type: \'info\' as \'success\' | \'error\' | \'info\' | \'warning\'\n' +
    '  });' +
    content.slice(lastStateIndex);
}

// Fonction pour remplacer les appels à alert()
function replaceAlertCalls(content) {
  // Remplacer les appels à alert() par des appels à setAlertModal()
  return content.replace(/alert\(([^)]+)\);/g, (match, alertContent) => {
    // Déterminer le type d'alerte (success ou error)
    const isError = alertContent.toLowerCase().includes('fail') ||
                   alertContent.toLowerCase().includes('error') ||
                   alertContent.toLowerCase().includes('échec');
    const type = isError ? 'error' : 'success';
    const title = isError ? 'Error' : 'Success';

    return `setAlertModal({\n` +
      `    isOpen: true,\n` +
      `    title: '${title}',\n` +
      `    message: ${alertContent},\n` +
      `    type: '${type}'\n` +
      `  });`;
  });
}

// Fonction pour ajouter le composant AlertModal dans le JSX
function addAlertModalComponent(content) {
  // Vérifier si le composant existe déjà
  if (content.includes('<AlertModal')) {
    return content;
  }

  // Trouver le début du JSX (après le return)
  const returnIndex = content.indexOf('return (');
  if (returnIndex === -1) return content;

  // Trouver l'ouverture de la première div après le return
  const firstDivIndex = content.indexOf('<div', returnIndex);
  if (firstDivIndex === -1) return content;

  // Trouver la fin de la première ligne de div
  const firstDivEndIndex = content.indexOf('>', firstDivIndex) + 1;

  // Ajouter le composant AlertModal après la première div
  return content.slice(0, firstDivEndIndex) +
    '\n      {/* Alert Modal */}\n' +
    '      <AlertModal\n' +
    '        isOpen={alertModal.isOpen}\n' +
    '        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}\n' +
    '        title={alertModal.title}\n' +
    '        message={alertModal.message}\n' +
    '        type={alertModal.type}\n' +
    '      />\n' +
    content.slice(firstDivEndIndex);
}

// Fonction principale pour modifier un fichier
function modifyFile(filePath) {
  console.log(`Modifying ${filePath}...`);

  let content = readFile(filePath);

  content = addAlertModalImport(content);
  content = addAlertModalState(content);
  content = replaceAlertCalls(content);
  content = addAlertModalComponent(content);

  writeFile(filePath, content);

  console.log(`${filePath} modified successfully.`);
}

// Exécuter le script pour chaque fichier
filesToModify.forEach(filePath => {
  try {
    modifyFile(filePath);
  } catch (error) {
    console.error(`Error modifying ${filePath}:`, error);
  }
});

console.log('All files modified successfully.');
