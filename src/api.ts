/**
 * src/api.ts — read-only calls to the website's app endpoints (docs/WEB_ALIGNMENT.md section 4).
 * Every call fails quietly: an institute site that does not have the endpoint yet keeps working
 * (the app then reads the same facts from the page itself, see siteScripts).
 */
import { siteUrl } from './config';
import { setSiteChrome } from './session';

interface MeResponse {
  signedIn?: boolean;
  initials?: string;
  profileImage?: string;
  isAdmin?: boolean;
  unread?: number;
  referralCode?: string;
}

/** GET /api/app/v1/me: who is signed in, for the top bar and the invite link. */
export async function loadMe(): Promise<void> {
  try {
    const res = await fetch(siteUrl('/api/app/v1/me'), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return;
    const me = (await res.json()) as MeResponse;
    if (!me.signedIn) return;
    const photo = me.profileImage ? (me.profileImage.startsWith('http') ? me.profileImage : siteUrl(me.profileImage)) : '';
    setSiteChrome({
      admin: !!me.isAdmin,
      initials: me.initials ?? '',
      ...(photo ? { avatar: photo } : {}),
      unread: me.unread ?? 0,
      referralCode: me.referralCode ?? '',
    });
  } catch {
    // endpoint missing or offline: nothing to do
  }
}

/** Link members share to invite others, with their referral code when known. */
export function inviteLink(referralCode: string): string {
  return siteUrl(referralCode ? `/register?code=${encodeURIComponent(referralCode)}` : '/register');
}
