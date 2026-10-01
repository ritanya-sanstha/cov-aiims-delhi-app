#!/usr/bin/env node
/**
 * Build 30: CT.* + ComponentRef + dual parser.js TSQualifiedName + hermes stub + Promise.kt
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const NM   = path.join(ROOT, 'node_modules');

// 1. CT.* -> bare name across all node_modules TypeScript files
function processFile(filePath) {
  let c; try { c = fs.readFileSync(filePath, 'utf8'); } catch (e) { return; }
  if (!c.includes('CT.')) return;
  const orig = c;
  const hadWD = c.includes('CT.WithDefault');
  c = c.replace(/\bCT\.([A-Z][a-zA-Z0-9_]*)/g, '$1');
  if (c === orig) return;
  if (hadWD && !c.includes('type WithDefault<')) {
    const lines = c.split('\n'); let li = -1;
    for (let i = 0; i < lines.length; i++)
      if (/^(import|export)\s/.test(lines[i]) && /from\s+['"]/.test(lines[i])) li = i;
    if (li !== -1) lines.splice(li + 1, 0, 'type WithDefault<T, _D> = T;');
    else lines.unshift('type WithDefault<T, _D> = T;');
    c = lines.join('\n');
  }
  fs.writeFileSync(filePath, c);
  console.log('[fix-codegen] CT.*: ' + path.relative(NM, filePath));
}
try {
  execSync('grep -r --include="*.ts" -l "CodegenTypes" "' + NM + '" 2>/dev/null',
    { encoding: 'utf8', maxBuffer: 20*1024*1024 })
    .trim().split('\n').filter(Boolean).forEach(processFile);
} catch (e) { console.log('[fix-codegen] CT scan: ' + e.message); }

// 2. React.ComponentRef -> React.ElementRef in react-native-screens specs
try {
  execSync('grep -r --include="*.ts" -l "React\\.ComponentRef" "' + path.join(NM,'react-native-screens/src') + '" 2>/dev/null',
    { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).forEach(f => {
      let c = fs.readFileSync(f, 'utf8'); const orig = c;
      c = c.replace(/React\.ComponentRef</g, 'React.ElementRef<');
      if (c !== orig) { fs.writeFileSync(f, c); console.log('[fix-codegen] ComponentRef->ElementRef: ' + path.relative(NM, f)); }
    });
} catch (e) { console.log('[fix-codegen] ComponentRef scan: ' + e.message); }

// 3. Patch getTypeAnnotationName in BOTH parser.js for TSQualifiedName
const PARSERS = [
  path.join(NM, '@react-native/codegen/lib/parsers/typescript/parser.js'),
  path.join(NM, 'react-native/node_modules/@react-native/codegen/lib/parsers/typescript/parser.js'),
];
const PATCH_FN = [
  'getTypeAnnotationName(typeAnnotation) {',
  '    const tn = typeAnnotation && typeAnnotation.typeName;',
  "    if (tn == null) return undefined;",
  "    if (tn.type === 'TSQualifiedName') return tn.right && tn.right.name;",
  '    return tn.name;',
  '  }'
].join('\n');
PARSERS.forEach(pp => {
  if (!fs.existsSync(pp)) { console.log('[fix-codegen] parser not found: ' + pp); return; }
  let src = fs.readFileSync(pp, 'utf8');
  if (src.includes('TSQualifiedName')) { console.log('[fix-codegen] parser already patched: ' + path.relative(NM,pp)); return; }
  const sig = 'getTypeAnnotationName(typeAnnotation)';
  const si = src.indexOf(sig);
  if (si === -1) { console.log('[fix-codegen] WARNING: sig not found: ' + path.relative(NM,pp)); return; }
  let bi = src.indexOf('{', si + sig.length);
  let depth = 1, pos = bi + 1;
  while (pos < src.length && depth > 0) { if (src[pos]==='{') depth++; else if (src[pos]==='}') depth--; pos++; }
  fs.writeFileSync(pp, src.substring(0, si) + PATCH_FN + src.substring(pos));
  console.log('[fix-codegen] Patched parser.js: ' + path.relative(NM, pp));
});

// 4. Hermes-compiler stub
const hd = path.join(NM, 'hermes-compiler');
if (!fs.existsSync(hd)) {
  fs.mkdirSync(hd, { recursive: true });
  fs.writeFileSync(path.join(hd,'package.json'), JSON.stringify({name:'hermes-compiler',version:'0.12.0',main:'index.js'}));
  fs.writeFileSync(path.join(hd,'index.js'), 'module.exports = {};\n');
  console.log('[fix-codegen] Created hermes-compiler stub');
} else { console.log('[fix-codegen] hermes-compiler stub OK'); }

// 5. Fix Promise.kt: change code: String? to code: String for 5 signatures
// that the com.facebook.react.bridge.Promise interface now marks @NonNull in RN 0.79
const pkt = path.join(NM, 'expo-modules-core/android/src/main/java/expo/modules/kotlin/Promise.kt');
if (fs.existsSync(pkt)) {
  let psrc = fs.readFileSync(pkt, 'utf8');
  const porig = psrc;
  const fixes = [
    ['reject(code: String?, throwable: Throwable?)', 'reject(code: String, throwable: Throwable?)'],
    ['reject(code: String?, message: String?, throwable: Throwable?)', 'reject(code: String, message: String?, throwable: Throwable?)'],
    ['reject(code: String?, userInfo: WritableMap)', 'reject(code: String, userInfo: WritableMap)'],
    ['reject(code: String?, throwable: Throwable?, userInfo: WritableMap)', 'reject(code: String, throwable: Throwable?, userInfo: WritableMap)'],
    ['reject(code: String?, message: String?, userInfo: WritableMap)', 'reject(code: String, message: String?, userInfo: WritableMap)'],
  ];
  let count = 0;
  for (const [from, to] of fixes) {
    if (psrc.includes(from)) { psrc = psrc.replace(from, to); count++; }
  }
  if (count > 0) { fs.writeFileSync(pkt, psrc); console.log('[fix-codegen] Promise.kt: fixed ' + count + ' signatures'); }
  else { console.log('[fix-codegen] Promise.kt: 0 matches — verify indentation'); }
} else { console.log('[fix-codegen] Promise.kt not found'); }

console.log('[fix-codegen] Build 30 done.');
