#!/usr/bin/env node
/**
 * Build 26: Patch CT.* CodegenTypes across ALL packages + patch codegen parser.
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NM   = path.join(ROOT, 'node_modules');

function processFile(filePath) {
  let c;
  try { c = fs.readFileSync(filePath, 'utf8'); } catch (e) { return; }
  if (!c.includes('CT.')) return;
  const orig = c;
  const hadWithDefault = c.includes('CT.WithDefault');
  c = c.replace(/\bCT\.([A-Z][a-zA-Z0-9_]*)/g, '$1');
  if (c === orig) return;
  if (hadWithDefault && !c.includes('type WithDefault<')) {
    const lines = c.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^(import|export)\s/.test(lines[i]) && /from\s+['"]/.test(lines[i]))
        lastImport = i;
    }
    const alias = 'type WithDefault<T, _D> = T;';
    if (lastImport !== -1) lines.splice(lastImport + 1, 0, alias);
    else lines.unshift(alias);
    c = lines.join('\n');
  }
  fs.writeFileSync(filePath, c);
  console.log('[fix-codegen] Patched: ' + path.relative(NM, filePath));
}

console.log('[fix-codegen] Scanning node_modules for CodegenTypes usage...');
let candidates = [];
try {
  const raw = execSync(
    `grep -rl "CodegenTypes" "${NM}" --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
  candidates = raw.trim().split('\n').filter(f =>
    f && !f.includes('/__tests__/') && !f.includes('/__mocks__/') &&
    !f.includes('/android/') && !f.includes('/ios/')
  );
} catch (_) {}

if (candidates.length > 0) {
  console.log('[fix-codegen] Found ' + candidates.length + ' file(s) with CodegenTypes');
  candidates.forEach(processFile);
} else {
  console.log('[fix-codegen] grep unavailable - scanning known packages');
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!['node_modules','__tests__','__mocks__','android','ios'].includes(e.name))
          scanDir(full);
      } else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) {
        processFile(full);
      }
    }
  }
  ['react-native-screens','react-native-safe-area-context',
   'react-native-gesture-handler'].forEach(pkg =>
    scanDir(path.join(NM, pkg, 'src'))
  );
}

const parserFile = path.join(NM, '@react-native/codegen/lib/parsers/typescript/parser.js');
if (fs.existsSync(parserFile)) {
  let code = fs.readFileSync(parserFile, 'utf8');
  const newImpl = [
    'getTypeAnnotationName(typeAnnotation) {',
    '    const tn = typeAnnotation && typeAnnotation.typeName;',
    '    if (tn == null) return undefined;',
    "    if (tn.type === 'TSQualifiedName') return tn.right && tn.right.name;",
    '    return tn.name;',
    '  }',
  ].join('\n');
  const exact = 'getTypeAnnotationName(typeAnnotation) {\n    return typeAnnotation?.typeName?.name;\n  }';
  if (code.includes(exact)) {
    fs.writeFileSync(parserFile, code.replace(exact, newImpl));
    console.log('[fix-codegen] Patched parser.js (exact)');
  } else {
    const re = /getTypeAnnotationName\s*\(\s*typeAnnotation\s*\)\s*\{[^}]*?return\s+typeAnnotation\?\.typeName\?\.name\s*;?\s*\}/;
    if (re.test(code)) {
      fs.writeFileSync(parserFile, code.replace(re, newImpl));
      console.log('[fix-codegen] Patched parser.js (regex)');
    } else {
      const idx = code.indexOf('getTypeAnnotationName');
      console.log('[fix-codegen] WARNING: parser.js pattern not found. Context:');
      if (idx >= 0) console.log(code.slice(idx, idx + 250));
    }
  }
}

const hermesDir = path.join(NM, 'hermes-compiler');
if (!fs.existsSync(hermesDir)) {
  fs.mkdirSync(hermesDir, { recursive: true });
  fs.writeFileSync(path.join(hermesDir, 'package.json'),
    JSON.stringify({ name: 'hermes-compiler', version: '0.12.0', main: 'index.js' }));
  fs.writeFileSync(path.join(hermesDir, 'index.js'), 'module.exports = {};');
  console.log('[fix-codegen] Created hermes-compiler stub');
}

console.log('[fix-codegen] Done');
