/**
 * src/theme.ts — design tokens for the native UI. See docs/DESIGN.md.
 *
 * Institute values (primary, highlight, secondary, alert) come from the register;
 * everything else is fixed for every institute's app.
 */
import { REGISTER } from './config';

/** Mix two #RRGGBB colours; `amount` is the share of `a` (0..1). */
export function mix(a: string, b: string, amount: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const c = (x: number, y: number) => Math.round(x * amount + y * (1 - amount)).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

const { primaryColor, accentColor, secondaryColor, alertColor } = REGISTER.branding;
const secondary = secondaryColor ?? primaryColor;
const alert = alertColor ?? '#B54321';

export const colors = {
  primary: primaryColor,
  highlight: accentColor,
  secondary,
  alert,
  /** Soft backgrounds for icon circles and chips */
  primaryTint: mix(primaryColor, '#FFFFFF', 0.12),
  secondaryTint: mix(secondary, '#FFFFFF', 0.12),
  alertTint: mix(alert, '#FFFFFF', 0.12),
  ground: '#F2F3F7',
  surface: '#FFFFFF',
  text: '#171717',
  textMuted: '#5F6672',
  textFaint: '#6B7280',
  line: '#EEF0F3',
  success: '#2D6A2D',
  successTint: '#E4F3E4',
  pending: '#6B4F00',
  pendingTint: '#FDF3CF',
  info: '#1F6285',
  infoTint: '#E3F0F7',
};

/** Loaded in app/_layout.tsx (same typefaces as the website). */
export const fonts = {
  title: 'PlusJakartaSans_800ExtraBold',
  titleMedium: 'PlusJakartaSans_700Bold',
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const radius = { input: 12, button: 16, card: 20, bar: 22 } as const;

export const shadow = {
  card: { elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  bar: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  tabBar: { elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
} as const;
