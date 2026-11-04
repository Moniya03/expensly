import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Surface } from 'react-native-paper';
import VoiceFAB from '../../components/VoiceFAB';
import { useAppTheme } from '../../constants/theme';

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surfaceContainer,
            borderTopWidth: 0,
            elevation: 2,
            height: 74,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.colors.onSecondaryContainer,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.pill,
                  focused && { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={22}
                  color={
                    focused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Goals',
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.pill,
                  focused && { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <Ionicons
                  name={focused ? 'flag' : 'flag-outline'}
                  size={22}
                  color={
                    focused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="voice"
          options={{
            title: '',
            tabBarButton: () => <View style={{ width: 72 }} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.pill,
                  focused && { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <Ionicons
                  name={focused ? 'time' : 'time-outline'}
                  size={22}
                  color={
                    focused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.pill,
                  focused && { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={22}
                  color={
                    focused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            ),
          }}
        />
      </Tabs>
      <VoiceFAB />
    </Surface>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
