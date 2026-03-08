import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Briefcase, ShoppingBag, User, Users } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants/Theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray[400],
      headerShown: true,
      headerStyle: {
        backgroundColor: COLORS.white,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray[100],
      },
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: SIZES.font.lg,
        color: COLORS.text.primary,
      },
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray[100],
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size + 2} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size + 2} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="professionals"
        options={{
          title: 'Pros',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size + 2} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size + 2} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size + 2} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
