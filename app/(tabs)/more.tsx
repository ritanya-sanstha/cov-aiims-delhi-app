import { tabPath } from '../../src/config';
import SiteWebView from '../../src/components/SiteWebView';
export default function MoreScreen() {
  return <SiteWebView path={tabPath('more')} />;
}
