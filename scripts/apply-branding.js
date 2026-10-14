/**
 * scripts/apply-branding.js — copy the register's logo to assets/brand/logo.png.
 *
 * Metro needs a fixed path for require(), so the app's in-UI logo (AppBar) always
 * reads assets/brand/logo.png. Run before type check / build:
 *   REGISTER_FILE=./registers/<institute>.register.json node scripts/apply-branding.js
 */
const fs = require('fs');
const path = require('path');

const registerFile = process.env.REGISTER_FILE || './registers/aiims-delhi.register.json';
const register = require(path.resolve(registerFile));
const src = path.resolve('assets/logos', register.branding.logoFile);
const dest = path.resolve('assets/brand/logo.png');

if (!fs.existsSync(src)) {
  console.error(`Logo not found: ${src}`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Branding applied: ${register.branding.logoFile} -> assets/brand/logo.png`);
