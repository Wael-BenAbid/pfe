/**
 * Script pour corriger les URLs d'API dans le code frontend
 * 
 * Ce script recherche et remplace les occurrences de doublon "api/api" dans les fichiers JavaScript/TypeScript
 */

const fs = require('fs');
const path = require('path');

// Fonction pour parcourir récursivement un répertoire
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Extensions de fichiers à traiter
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Motifs à rechercher et remplacer
const patterns = [
  {
    search: /\$\{API_BASE_URL\}\/api\/auth\//g,
    replace: '${API_BASE_URL}/auth/'
  },
  {
    search: /\$\{API_BASE_URL\}\/api\/api\//g,
    replace: '${API_BASE_URL}/api/'
  }
];

// Parcourir le répertoire src
walkDir(path.resolve('src'), function(filePath) {
  // Vérifier si le fichier a une extension à traiter
  if (fileExtensions.includes(path.extname(filePath))) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Appliquer les remplacements
    patterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
      }
    });
    
    // Enregistrer le fichier si modifié
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed API URLs in ${filePath}`);
    }
  }
});

console.log('API URL fix completed');
