'use strict';
const crypto = require('crypto');
const BASE_FONTS = require('./native-fonts.json');
// Font names come from the pinned Camoufox Windows font lists; no font files
// are distributed here. Keep the base set, including CJK and fallback fonts.
const FONT_GROUPS = [
  ['Book Antiqua', 'Century Gothic', 'Garamond', 'Monotype Corsiva'],
  ['Agency FB', 'Algerian', 'Bauhaus 93', 'Bookman Old Style'],
  ['Cascadia Code', 'Cascadia Mono'],
  ['Fira Code', 'Fira Mono', 'Fira Sans'],
  ['Roboto', 'Roboto Condensed', 'Roboto Mono', 'Roboto Slab'],
  ['Source Code Pro', 'Source Sans 3', 'Source Serif 4'],
  ['Open Sans', 'Lato', 'Montserrat'],
  ['JetBrains Mono', 'Inter'],
];
const ALLOWED_FONTS = new Set([...BASE_FONTS, ...FONT_GROUPS.flat()]);
function fontModes() {
  return [{ id: 'native', name: '原生字体' }, ...(process.platform === 'win32' ? [{ id: 'windows-v1', name: '按环境固定 Windows 字体集' }] : [])];
}
function completeKernelFonts(profile) {
  const mode = profile.kernelFontMode || 'native';
  if (mode !== 'windows-v1' || !/^[a-f0-9]{32}$/.test(profile.fingerprintSeed || '')) return { ...profile, kernelFontMode: mode };
  if (profile.kernelFonts && profile.kernelFonts.seed === profile.fingerprintSeed) return profile;
  const bits = crypto.createHash('sha256').update('CIKE Windows fonts v1\0' + profile.fingerprintSeed).digest()[0];
  const families = [...new Set([...BASE_FONTS, ...FONT_GROUPS.filter((_, index) => bits & (1 << index)).flat()])];
  return { ...profile, kernelFonts: { version: 1, seed: profile.fingerprintSeed, families } };
}
function validateKernelFonts(profile) {
  const mode = profile.kernelFontMode || 'native';
  const bad = () => { throw Object.assign(new Error('内核字体配置无效，请重新选择字体策略或生成另一组'), { status: 400 }); };
  if (!fontModes().some(option => option.id === mode)) bad();
  if (mode === 'native') return;
  const snapshot = profile.kernelFonts;
  if (!snapshot || snapshot.version !== 1 || snapshot.seed !== profile.fingerprintSeed || !Array.isArray(snapshot.families) ||
      snapshot.families.length > ALLOWED_FONTS.size || new Set(snapshot.families).size !== snapshot.families.length ||
      !snapshot.families.every(font => ALLOWED_FONTS.has(font)) || !BASE_FONTS.every(font => snapshot.families.includes(font))) bad();
}
module.exports = { fontModes, completeKernelFonts, validateKernelFonts };
