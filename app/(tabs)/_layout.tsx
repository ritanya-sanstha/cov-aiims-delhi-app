/**
 * app/(tabs)/_layout.tsx — Bottom tab navigator
 *
 * All config (colors, tab labels, icons) comes from the Register Artifact.
 * Never hardcode anything here — if it should change per institute, it's in REGISTER.
 *
 * Tab icons: Ionicons (bundled with @expo/vector-icons)
 * Tab mapping:
 *   home      → /dashboard
 *   helpline  → /helpline
 *   directory → /directory
 *   jobs      → /jobs
 *   more      → /more
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER } from '../../src/config';

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

const primary  = REGISTER.branding.primaryColor;  // '#1B2B5E'
const inactive = '#9CA3AF';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 6,
          paddingTop: 4,
          height: 60,
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
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
