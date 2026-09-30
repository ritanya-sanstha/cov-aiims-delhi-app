const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../node_modules/react-native-screens/src/fabric/FullWindowOverlayNativeComponent.ts');
if (!fs.existsSync(file)) { console.log('[fix-screens] file not found, skipping'); process.exit(0); }
let c = fs.readFileSync(file, 'utf8');
c = c.replace("import type { CodegenTypes as CT, ViewProps } from 'react-native';", "import type { ViewProps } from 'react-native';");
c = c.replace('accessibilityContainerViewIsModal?: CT.WithDefault<boolean, true>;', 'accessibilityContainerViewIsModal?: boolean;');
fs.writeFileSync(file, c);
console.log('[fix-screens] Fixed FullWindowOverlayNativeComponent.ts');
