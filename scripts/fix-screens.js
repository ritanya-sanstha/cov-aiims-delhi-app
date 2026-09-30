const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  if (!c.includes('CT.WithDefault')) return;
  const orig = c;

  // Replace CT.WithDefault<T,D> with WithDefault<T,D> via local alias.
  // Metro needs the "WithDefault" name in AST to extract default values.
  // Gradle codegen resolves the local alias to just T.
  // IMPORTANT: do NOT remove "CodegenTypes as CT" import — CT.Double,
  // CT.Int32, CT.Float, CT.DirectEventHandler must stay resolvable.
  c = c.replace(/CT\.WithDefault</g, 'WithDefault<');

  // Insert local alias AFTER the last closing-import line
  const lines = c.split('\n');
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/from ['"][^'"]+['"];?\s*$/.test(lines[i])) last = i;
  }
  if (last !== -1) lines.splice(last + 1, 0, 'type WithDefault<T, _D> = T;');
  else lines.unshift('type WithDefault<T, _D> = T;');
  c = lines.join('\n');

  if (c !== orig) {
    fs.writeFileSync(filePath, c);
    console.log('[fix-screens] Fixed: ' + path.basename(filePath));
  }
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) processDir(path.join(dir, e.name));
    else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) processFile(path.join(dir, e.name));
  }
}

processDir(path.join(__dirname, '../node_modules/react-native-screens/src'));

// Stub hermes-compiler npm package
const hDir = path.join(__dirname, '../node_modules/hermes-compiler');
if (!fs.existsSync(hDir)) {
  fs.mkdirSync(hDir, { recursive: true });
  fs.writeFileSync(path.join(hDir, 'package.json'),
    JSON.stringify({name:'hermes-compiler',version:'0.12.0',main:'index.js'}));
  fs.writeFileSync(path.join(hDir, 'index.js'), 'module.exports={};');
  console.log('[fix-screens] Created hermes-compiler stub');
}
console.log('[fix-screens] Done');
