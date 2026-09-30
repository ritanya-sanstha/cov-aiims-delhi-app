const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  if (!c.includes('CT.')) return;          // skip files with no CT.* at all
  const orig = c;

  // Track whether we need the WithDefault alias
  const hadWithDefault = c.includes('CT.WithDefault');

  // Replace ALL CodegenTypes qualified names (CT.*) with bare identifiers.
  //
  // Root cause: RN 0.79 codegen's getTypeAnnotationName() does typeName.name.
  // For TSQualifiedName (CT.Foo) typeName has left/right but NO .name → undefined.
  // For a bare Identifier (Foo) typeName.name === 'Foo' → works.
  //
  // Specific failures without these fixes:
  //   CT.WithDefault<>     → typeName.name=undefined → parseTopLevelType skips
  //   CT.Double[]          → getTypeAnnotationForArray → type='TSTypeReference' → throws
  //   CT.Float / CT.Int32  → getTypeAnnotationName → undefined → getCommonTypeAnnotation misses
  //   CT.DirectEventHandler→ isEventHandler → eventNames.has(undefined) → false → throws
  //   CT.UnsafeMixed[]     → same path as CT.Double[]
  c = c.replace(/CT\.WithDefault</g,      'WithDefault<');
  c = c.replace(/CT\.DirectEventHandler</g,'DirectEventHandler<');
  c = c.replace(/CT\.Double/g,            'Double');
  c = c.replace(/CT\.Float/g,             'Float');
  c = c.replace(/CT\.Int32/g,             'Int32');
  c = c.replace(/CT\.UnsafeMixed/g,       'UnsafeMixed');

  // If we introduced WithDefault<>, inject a local alias so TypeScript is happy.
  // parseTopLevelType recognises "WithDefault" by name and handles it as a
  // built-in; Gradle resolves the alias (type WithDefault<T,_D>=T) to just T.
  if (hadWithDefault) {
    const lines = c.split('\n');
    let last = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/from ['"][^'"]+['"];?\s*$/.test(lines[i])) last = i;
    }
    if (last !== -1) lines.splice(last + 1, 0, 'type WithDefault<T, _D> = T;');
    else lines.unshift('type WithDefault<T, _D> = T;');
    c = lines.join('\n');
  }

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

// Stub hermes-compiler npm package (Metro requires it at module resolution time)
const hDir = path.join(__dirname, '../node_modules/hermes-compiler');
if (!fs.existsSync(hDir)) {
  fs.mkdirSync(hDir, { recursive: true });
  fs.writeFileSync(path.join(hDir, 'package.json'),
    JSON.stringify({name:'hermes-compiler',version:'0.12.0',main:'index.js'}));
  fs.writeFileSync(path.join(hDir, 'index.js'), 'module.exports={};');
  console.log('[fix-screens] Created hermes-compiler stub');
}
console.log('[fix-screens] Done');
