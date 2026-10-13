/**
 * app/[...path].tsx — catch-all for website links opened from outside the app
 * (e.g. a shared lesson link https://<site>/sundaysessions/123). Any path that
 * is not one of the app's own screens is shown from the website inside the
 * app, instead of "Unmatched Route".
 */
import { useGlobalSearchParams, usePathname } from 'expo-router';
import InAppPage from '../src/components/InAppPage';

export default function WebsiteLink() {
  const pathname = usePathname();
  const { path: _slug, ...query } = useGlobalSearchParams<Record<string, string | string[]>>();
  const qs = Object.entries(query)
    .flatMap(([k, v]) => (Array.isArray(v) ? v : [v]).map((x) => `${encodeURIComponent(k)}=${encodeURIComponent(String(x))}`))
    .join('&');
  return <InAppPage path={qs ? `${pathname}?${qs}` : pathname} />;
}
