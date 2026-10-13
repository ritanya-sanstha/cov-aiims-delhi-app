import { tabPath, tabLabel } from '../../src/config';
import SiteWebView from '../../src/components/SiteWebView';
export default function JobsScreen() {
  return <SiteWebView path={tabPath('jobs')} title={tabLabel('jobs')} />;
}
