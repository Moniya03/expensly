import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import VoiceFAB from '../../components/VoiceFAB';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0F1A' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#080D18',
            borderTopWidth: 0,
            height: 72,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#1DC496',
          tabBarInactiveTintColor: 'rgba(173,186,214,0.58)',
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Goals',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'flag' : 'flag-outline'} size={24} color={color} />
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
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <VoiceFAB />
    </View>
  );
}
