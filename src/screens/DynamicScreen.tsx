import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MobileAPI } from '../config/api';
import { DynamicComponent } from '../components/DynamicRenderer';
import { Ionicons } from '@expo/vector-icons';

interface DynamicScreenProps {
  route?: any;
  navigation?: any;
  slug?: string;
}

export const DynamicScreen: React.FC<DynamicScreenProps> = ({ route, navigation, slug: propSlug }) => {
  const pageSlug = propSlug || route?.params?.slug || 'home';
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setError(null);
    try {
      const data = await MobileAPI.getPage(pageSlug);
      setPageData(data);
    } catch (err: any) {
      console.error(`[FlowForge] Error loading page '${pageSlug}':`, err);
      setError(
        err.response?.data?.message ||
          `Unable to load page "${pageSlug}". Ensure the page is published and backend is running.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageSlug]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Rendering server-driven UI...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Page Unavailable</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPage}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const components = [...(pageData?.components || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const layoutType = pageData?.layout?.type || 'scroll';

  if (layoutType === 'stack') {
    return (
      <SafeAreaView style={styles.screenWrapper}>
        <View style={styles.contentContainer}>
          {components.map((comp) => (
            <DynamicComponent
              key={comp.id}
              component={comp}
              navigation={navigation}
              onRefresh={onRefresh}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenWrapper}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {components.map((comp) => (
          <DynamicComponent
            key={comp.id}
            component={comp}
            navigation={navigation}
            onRefresh={onRefresh}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
