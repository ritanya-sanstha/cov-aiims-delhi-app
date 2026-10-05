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
    ['reject(code: String?, message: String?)', 'reject(code: String, message: String?)'],
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
// 5b. Fix KPromiseWrapper.kt: fix String? -> String at bridgePromise.reject call site
const kpwPath = path.join(NM, 'expo-modules-core/android/src/main/java/expo/modules/kotlin/KPromiseWrapper.kt');
if (fs.existsSync(kpwPath)) {
  let kpwSrc = fs.readFileSync(kpwPath, 'utf8');
  const oldCall = 'bridgePromise.reject(code, message, cause)';
  const newCall = 'bridgePromise.reject(code ?: "UnknownCode", message, cause)';
  if (kpwSrc.includes(oldCall)) {
    kpwSrc = kpwSrc.replace(oldCall, newCall);
    fs.writeFileSync(kpwPath, kpwSrc, 'utf8');
    console.log('[fix-codegen] KPromiseWrapper.kt: patched reject call String? -> String');
  } else {
    console.log('[fix-codegen] KPromiseWrapper.kt: already patched or pattern not found');
  }
} else {
  console.log('[fix-codegen] KPromiseWrapper.kt not found, skipping');
}





// Step 6: Fix UIManagerHelperExt.kt - Rewrite as top-level function (not extension)
// K2 Kotlin 2.2.0 strict rule: extension functions CANNOT be called via Java class reference.
// Callers do: UIManagerHelper\n    .getFabricUIManagerNotNull(ctx) - invalid in K2 strict mode.
// Fix: make getFabricUIManagerNotNull a plain top-level function; update callers in Step 8.
const uiManagerExtPath = path.join(NM, 'react-native-screens/android/src/main/java/com/swmansion/rnscreens/gamma/helpers/UIManagerHelperExt.kt');
if (fs.existsSync(uiManagerExtPath)) {
  const newContent = [
    'package com.swmansion.rnscreens.gamma.helpers',
    '',
    'import com.facebook.react.bridge.UIManager',
    'import com.facebook.react.uimanager.ThemedReactContext',
    'import com.facebook.react.uimanager.UIManagerHelper',
    'import com.facebook.react.uimanager.common.UIManagerType',
    '',
    'internal fun getFabricUIManagerNotNull(reactContext: ThemedReactContext): UIManager =',
    '    checkNotNull(UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)) {',
    '        "[RNScreens] UIManager must not be null"',
    '    }',
    '',
  ].join('\n');
  fs.writeFileSync(uiManagerExtPath, newContent, 'utf8');
  console.log('[fix-codegen] UIManagerHelperExt.kt: rewritten as top-level function (K2 fix)');
} else {
  console.log('[fix-codegen] UIManagerHelperExt.kt not found, skipping');
}

// Step 7: Fix FormSheetContentView.kt  RN 0.79 dropped childView param from JSPointerDispatcher.onChildStartedNativeGesture
// Old: onChildStartedNativeGesture(childView, ev, eventDispatcher)   3 args
// New: onChildStartedNativeGesture(ev, eventDispatcher)              2 args
const formSheetPath = path.join(NM, 'react-native-screens/android/src/main/java/com/swmansion/rnscreens/gamma/modals/formsheet/FormSheetContentView.kt');
if (fs.existsSync(formSheetPath)) {
  let src = fs.readFileSync(formSheetPath, 'utf8');
  // Use regex to handle both single-line and multi-line variants of the 3-arg call
  const oldCallRegex = /jsTouchDispatcher\.onChildStartedNativeGesture\(ev,\s*\n?\s*eventDispatcher,\s*\n?\s*themedReactContext\)/;
  const newCall = 'jsTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher)';
  if (oldCallRegex.test(src)) {
    src = src.replace(oldCallRegex, newCall);
    fs.writeFileSync(formSheetPath, src, 'utf8');
    console.log('[fix-codegen] FormSheetContentView.kt: patched jsTouchDispatcher.onChildStartedNativeGesture (removed themedReactContext arg)');
  } else {
    console.log('[fix-codegen] FormSheetContentView.kt: jsTouchDispatcher pattern not found (may be already patched or version differs)');
  }
} else {
  console.log('[fix-codegen] FormSheetContentView.kt not found, skipping');
}


// Step 8: Fix gamma callers - change UIManagerHelper\n.getFabricUIManagerNotNull(
// to getFabricUIManagerNotNull( so they call the top-level function (K2 compatible)
// The import 'import com.swmansion.rnscreens.gamma.helpers.getFabricUIManagerNotNull' still works.
const callerFiles = [
  'react-native-screens/android/src/main/java/com/swmansion/rnscreens/gamma/modals/formsheet/FormSheetContentView.kt',
  'react-native-screens/android/src/main/java/com/swmansion/rnscreens/gamma/stack/header/config/StackHeaderConfig.kt',
  'react-native-screens/android/src/main/java/com/swmansion/rnscreens/gamma/stack/host/StackHost.kt',
  'react-native-screens/android/src/main/java/com/swmansion/rnscreens/gamma/tabs/host/TabsHost.kt',
];
callerFiles.forEach(rel => {
  const p = path.join(NM, rel);
  if (!fs.existsSync(p)) { console.log('[fix-codegen] caller not found: ' + rel); return; }
  let src = fs.readFileSync(p, 'utf8');
  // Pattern: UIManagerHelper followed by newline+whitespace+.getFabricUIManagerNotNull(
  // Replace with: getFabricUIManagerNotNull(  (top-level call, import still valid)
  const patched = src.replace(
    /UIManagerHelper\r?\n[ \t]*\.getFabricUIManagerNotNull\(/g,
    'getFabricUIManagerNotNull('
  );
  if (patched !== src) {
    fs.writeFileSync(p, patched, 'utf8');
    console.log('[fix-codegen] Fixed getFabricUIManagerNotNull calls in: ' + path.basename(p));
  } else {
    console.log('[fix-codegen] Pattern not found (may already be fixed) in: ' + path.basename(p));
  }
});

console.log('[fix-codegen] Build 35 done.');

// Step 9: Fix expo-modules-core ReactStylesDiffMapBackingFieldAccessor.java
// In RN 0.79, ReactStylesDiffMap.internal_backingMap() was removed.
// The backing field is now package-private mBackingMap; direct field access is
// valid since both classes share package com.facebook.react.uimanager.
const backingFieldPath = path.join(
  NM,
  'expo-modules-core/android/src/main/java/com/facebook/react/uimanager/ReactStylesDiffMapBackingFieldAccessor.java'
);
if (fs.existsSync(backingFieldPath)) {
  let bfSrc = fs.readFileSync(backingFieldPath, 'utf8');
  const oldMethod = /diffMap\.internal_backingMap\(\)/;
  const newField = 'diffMap.mBackingMap';
  if (oldMethod.test(bfSrc)) {
    bfSrc = bfSrc.replace(oldMethod, newField);
    fs.writeFileSync(backingFieldPath, bfSrc, 'utf8');
    console.log('[fix-codegen] ReactStylesDiffMapBackingFieldAccessor.java: replaced internal_backingMap() with mBackingMap field access');
  } else {
    console.log('[fix-codegen] ReactStylesDiffMapBackingFieldAccessor.java: internal_backingMap() pattern not found (may already be patched)');
  }
} else {
  console.log('[fix-codegen] ReactStylesDiffMapBackingFieldAccessor.java: file not found, skipping');
}

