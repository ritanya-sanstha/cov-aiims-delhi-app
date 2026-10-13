/**
 * app/index.tsx — the "/" route (app launch).
 *
 * Shown briefly while the root layout checks the login state and redirects
 * to (auth)/login or (tabs)/home. Without this route, "/" is unmatched and
 * expo-router shows "Unmatched Route".
 */
import { View, ActivityIndicator } from 'react-native';
import { REGISTER } from '../src/config';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: REGISTER.branding.splashBg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={REGISTER.branding.accentColor} />
    </View>
  );
}
