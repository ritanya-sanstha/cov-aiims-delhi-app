const fs = require('fs');
const path = require('path');

// Proper parser: handles CT.WithDefault<complex<nested>, default> correctly
function replaceWithDefaults(content) {
  const marker = 'CT.WithDefault<';
  let result = '';
  let i = 0;
  while (i < content.length) {
    const idx = content.indexOf(marker, i);
    if (idx === -1) { result += content.slice(i); break; }
    result += content.slice(i, idx);
    let depth = 0;
    let j = idx + marker.length;
    let commaAt = -1;
    let closeAt = -1;
    while (j < content.length) {
      const ch = content[j];
      if (ch === '<') depth++;
      else if (ch === '>') {
        if (depth === 0) { closeAt = j; break; }
        depth--;
      } else if (ch === ',' && depth === 0 && commaAt === -1) {
        commaAt = j;
      }
      j++;
    }
    if (commaAt !== -1 && closeAt !== -1) {
      result += content.slice(idx + marker.length, commaAt).trim();
      i = closeAt + 1;
    } else {
      result += marker;
      i = idx + marker.length;
    }
  }
  return result;
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) processDir(path.join(dir, entry.name));
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) processFile(path.join(dir, entry.name));
  }
}

function processFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const orig = c;
  c = replaceWithDefaults(c);
  if (c !== orig && !c.includes('CT.')) {
    c = c.replace(/,\s*CodegenTypes as CT/g, '');
    c = c.replace(/CodegenTypes as CT,\s*/g, '');
  }
  if (c !== orig) {
    fs.writeFileSync(filePath, c);
    console.log('[fix-screens] Fixed: ' + path.basename(filePath));
  }
}

const srcDir = path.join(__dirname, '../node_modules/react-native-screens/src');
processDir(srcDir);
console.log('[fix-screens] Done');
