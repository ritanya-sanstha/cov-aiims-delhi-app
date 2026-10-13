/**
 * app/page.tsx — a website page opened from the More menu:
 * router.push({ pathname: '/page', params: { path, title } }).
 */
import { useLocalSearchParams } from 'expo-router';
import InAppPage from '../src/components/InAppPage';

export default function PageScreen() {
  const { path, title } = useLocalSearchParams<{ path: string; title?: string }>();
  return <InAppPage path={path ?? '/'} title={title} />;
}
