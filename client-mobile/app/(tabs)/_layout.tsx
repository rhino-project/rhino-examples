import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle:  { backgroundColor: colors.bg1, borderBottomWidth: 0 },
        headerTitleStyle: { color: colors.fg, fontWeight: '700' },
        headerTintColor: colors.fg,
        tabBarStyle: { backgroundColor: colors.bg1, borderTopColor: colors.border, borderTopWidth: 1 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.fgMuted,
        sceneStyle: { backgroundColor: colors.bg0 },
      }}>
      <Tabs.Screen name="index"    options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline"     size={size} color={color} /> }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects',  tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline"   size={size} color={color} /> }} />
      <Tabs.Screen name="tasks"    options={{ title: 'Tasks',     tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="more"     options={{ title: 'More',      tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
