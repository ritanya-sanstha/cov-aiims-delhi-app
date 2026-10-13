import { tabPath, tabLabel, REGISTER } from '../../src/config';
import { getHomePath } from '../../src/session';
import SiteWebView from '../../src/components/SiteWebView';

export default function HomeScreen() {
  // After login, show the page the website sent the user to; otherwise the
  // register's home path.
  return <SiteWebView path={getHomePath(tabPath('home'))} title={REGISTER.institute.name} />;
}
