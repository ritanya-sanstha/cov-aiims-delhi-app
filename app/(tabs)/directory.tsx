import { tabPath } from '../../src/config';
import SiteWebView from '../../src/components/SiteWebView';
export default function DirectoryScreen() {
  return <SiteWebView path={tabPath('directory')} />;
}
