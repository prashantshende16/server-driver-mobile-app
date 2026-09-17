import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MobileAPI } from '../config/api';
import { DynamicScreen } from '../screens/DynamicScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Map string icon names from admin panel to Ionicons
const resolveIconName = (name?: string): keyof typeof Ionicons.glyphMap => {
  switch (name?.toLowerCase()) {
    case 'home':
      return 'home';
    case 'calendar':
    case 'events':
      return 'calendar';
    case 'user':
    case 'profile':
      return 'person';
    case 'bell':
      return 'notifications';
    case 'search':
      return 'search';
    case 'settings':
      return 'settings';
    case 'bookmark':
      return 'bookmark';
    case 'list':
      return 'list';
    case 'grid':
      return 'grid';
    case 'heart':
      return 'heart';
    default:
      return 'apps';
  }
};

const DynamicTabNavigator: React.FC<{ config: any }> = ({ config }) => {
  const navConfig = config?.navigation?.bottom_tabs || config?.navigation || {};
  const items = navConfig?.items || [
    { title: 'Home', icon: 'home', page: 'home' },
    { title: 'Events', icon: 'calendar', page: 'events' },
    { title: 'Profile', icon: 'user', page: 'profile' },
  ];

  const primaryColor = config?.theme?.primary_color || '#2563eb';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          backgroundColor: '#ffffff',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0f172a',
        },
        headerShadowVisible: false,
      }}
    >
      {items.map((item: any, idx: number) => {
        const pageSlug = item.page || 'home';
        return (
          <Tab.Screen
            key={idx}
            name={`Tab_${item.title || pageSlug}`}
            options={{
              title: item.title || pageSlug,
              tabBarLabel: item.title || pageSlug,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={resolveIconName(item.icon)} size={size} color={color} />
              ),
              tabBarBadge: item.badge ? item.badge : undefined,
            }}
          >
            {(props) => <DynamicScreen {...props} slug={pageSlug} />}
          </Tab.Screen>
        );
      })}
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MobileAPI.getConfig();
      setConfig(data);
    } catch (e: any) {
      console.error('[FlowForge Mobile] Config bootstrap error:', e);
      setError('Could not connect to FlowForge API. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingTitle}>FlowForge</Text>
        <Text style={styles.loadingSubtitle}>Bootstrapping dynamic UI from server...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="warning-outline" size={54} color="#ef4444" />
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadConfig}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Dynamic Main Tabs */}
        <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
          {() => <DynamicTabNavigator config={config} />}
        </Stack.Screen>

        {/* Stack Screen for dynamic navigate actions */}
        <Stack.Screen
          name="DynamicPage"
          component={DynamicScreen}
          options={({ route }: any) => ({
            title: route.params?.title || 'Page',
            headerBackTitle: 'Back',
            headerTintColor: config?.theme?.primary_color || '#2563eb',
            headerShadowVisible: false,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
