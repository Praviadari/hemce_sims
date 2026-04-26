const fs = require('fs');

const raw = fs.readFileSync('eslint-final.txt', 'utf8');
const blocks = raw.split('\n\n');

for (const block of blocks) {
  const matchFile = block.match(/file\s*:\s*(.+)/);
  const matchMsg = block.match(/msg\s*:\s*'([^']+)'(?: is defined but never used| is assigned a value but never used)/);
  
  if (matchFile && matchMsg) {
    const file = matchFile[1].trim();
    const varName = matchMsg[1];
    
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      if (varName === 'e' || varName === '_') {
        content = content.replace(/\(e\)\s*=>/g, '() =>').replace(/e\s*=>/g, '() =>');
      } else {
        const importRegex = new RegExp(`\\b${varName}\\b\\s*,?\\s*`);
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('import')) {
            lines[i] = lines[i].replace(importRegex, '')
              .replace(/{\s*,/, '{')
              .replace(/,\s*}/, '}')
              .replace(/{\s*}/, '');
          }
        }
        content = lines.filter(l => !l.trim().startsWith('import') || !l.trim().endsWith('from')).join('\n');
      }
      fs.writeFileSync(file, content);
    }
  }
}
console.log('Done fixing unused imports.');
