/**
 * app/(tabs)/_layout.tsx — Bottom tab navigator
 *
 * All config (colors, tab labels, icons) comes from the Register Artifact.
 * Never hardcode anything here — if it should change per institute, it's in REGISTER.
 *
 * Tab icons: Ionicons (bundled with @expo/vector-icons)
 * Tab mapping:
 *   home      → /
 *   helpline  → /helpline
 *   directory → /directory
 *   jobs      → /jobs
 *   more      → /more
 */
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER } from '../../src/config';
import { colors, fonts, shadow } from '../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Map our Register Artifact icon keys to Ionicons names
const ICON_MAP: Record<string, { outline: IoniconName; filled: IoniconName }> = {
  home:      { outline: 'home-outline',      filled: 'home'       },
  heart:     { outline: 'heart-outline',     filled: 'heart'      },
  people:    { outline: 'people-outline',    filled: 'people'     },
  briefcase: { outline: 'briefcase-outline', filled: 'briefcase'  },
  grid:      { outline: 'grid-outline',      filled: 'grid'       },
  more:      { outline: 'ellipsis-horizontal-outline', filled: 'ellipsis-horizontal' },
};

const primary  = colors.primary;
const inactive = colors.textFaint;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: inactive,
        tabBarAllowFontScaling: false,
        // floating rounded bar, like the website's own bottom bar
        tabBarStyle: {
          position: 'relative',
          marginHorizontal: 12,
          marginBottom: insets.bottom + 8,
          borderRadius: 22,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          backgroundColor: colors.surface,
          ...shadow.tabBar,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 10,
          letterSpacing: 0.2,
          textTransform: 'uppercase',
        },
      }}
    >
      {REGISTER.navigation.tabs.map((tab) => {
        const icons = ICON_MAP[tab.icon] ?? { outline: 'ellipsis-horizontal-outline', filled: 'ellipsis-horizontal' };
        return (
          <Tabs.Screen
            key={tab.id}
            name={tab.id}
            options={{
              title: tab.label,
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons
                  name={focused ? icons.filled : icons.outline}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
