import { tabPath } from '../../src/config';
import SiteWebView from '../../src/components/SiteWebView';
export default function HomeScreen() {
  return <SiteWebView path={tabPath('home')} />;
}
