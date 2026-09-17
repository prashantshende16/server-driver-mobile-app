import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { handleAction } from '../engine/ActionHandler';
import { DynamicForm } from './DynamicForm';
import { apiClient } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ComponentProps {
  component: {
    id: string;
    type: string;
    order?: number;
    props?: Record<string, any>;
    style?: Record<string, any>;
    visibility?: { visible?: boolean; rule?: string };
    actions?: any[];
    data_source?: { type: string; endpoint?: string; data?: any[] } | null;
  };
  navigation?: any;
  onRefresh?: () => void;
}

export const DynamicComponent: React.FC<ComponentProps> = ({
  component,
  navigation,
  onRefresh,
}) => {
  const { type, props = {}, style = {}, visibility, actions, data_source } = component;
  const [dataSourceData, setDataSourceData] = useState<any[] | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(!!data_source && data_source.type === 'api');

  // Check visibility rules
  if (visibility && visibility.visible === false) {
    return null;
  }

  // Handle data sources
  useEffect(() => {
    if (data_source) {
      if (data_source.type === 'api' && data_source.endpoint) {
        apiClient
          .get(data_source.endpoint)
          .then((res) => {
            setDataSourceData(res.data?.data || res.data || []);
          })
          .catch((err) => {
            console.error('[FlowForge] Data source fetch error:', err);
          })
          .finally(() => setLoadingData(false));
      } else if (data_source.type === 'static' && Array.isArray(data_source.data)) {
        setDataSourceData(data_source.data);
      }
    }
  }, [data_source]);

  const onPressPrimaryAction = () => {
    if (actions && actions.length > 0) {
      handleAction(actions[0], navigation, onRefresh);
    } else if (props.action) {
      handleAction(props.action, navigation, onRefresh);
    }
  };

  switch (type) {
    case 'heading':
      return (
        <Text
          style={[
            styles.heading,
            props.size === 'small' && styles.headingSmall,
            props.size === 'large' && styles.headingLarge,
            props.color && { color: props.color },
            style,
          ]}
        >
          {props.text || props.title || ''}
        </Text>
      );

    case 'text':
      return (
        <Text
          style={[
            styles.bodyText,
            props.color && { color: props.color },
            props.align && { textAlign: props.align },
            style,
          ]}
        >
          {props.text || props.content || ''}
        </Text>
      );

    case 'banner':
      return (
        <TouchableOpacity
          activeOpacity={actions || props.action ? 0.9 : 1}
          onPress={onPressPrimaryAction}
          style={[styles.bannerContainer, style]}
        >
          {props.image ? (
            <Image source={{ uri: props.image }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: props.bgColor || '#3b82f6' }]} />
          )}
          <View style={styles.bannerOverlay}>
            {props.title && <Text style={styles.bannerTitle}>{props.title}</Text>}
            {props.subtitle && <Text style={styles.bannerSubtitle}>{props.subtitle}</Text>}
          </View>
        </TouchableOpacity>
      );

    case 'card':
      return (
        <TouchableOpacity
          activeOpacity={actions || props.action ? 0.8 : 1}
          onPress={onPressPrimaryAction}
          style={[styles.card, style]}
        >
          {props.image && (
            <Image source={{ uri: props.image }} style={styles.cardImage} resizeMode="cover" />
          )}
          <View style={styles.cardBody}>
            {props.title && <Text style={styles.cardTitle}>{props.title}</Text>}
            {props.subtitle && <Text style={styles.cardSubtitle}>{props.subtitle}</Text>}
            {props.description && <Text style={styles.cardDescription}>{props.description}</Text>}
          </View>
        </TouchableOpacity>
      );

    case 'image':
      return (
        <TouchableOpacity
          activeOpacity={actions || props.action ? 0.85 : 1}
          onPress={onPressPrimaryAction}
          style={[styles.imageContainer, style]}
        >
          <Image
            source={{ uri: props.src || props.image || props.url }}
            style={[styles.image, props.height ? { height: props.height } : null]}
            resizeMode={props.resizeMode || 'cover'}
          />
        </TouchableOpacity>
      );

    case 'button':
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressPrimaryAction}
          style={[
            styles.button,
            props.variant === 'secondary' && styles.buttonSecondary,
            props.variant === 'outline' && styles.buttonOutline,
            props.bgColor && { backgroundColor: props.bgColor },
            style,
          ]}
        >
          {props.icon && (
            <Ionicons
              name={props.icon}
              size={18}
              color={props.variant === 'outline' ? '#2563eb' : '#ffffff'}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              props.variant === 'outline' && styles.buttonOutlineText,
              props.textColor && { color: props.textColor },
            ]}
          >
            {props.label || props.title || 'Submit'}
          </Text>
        </TouchableOpacity>
      );

    case 'list': {
      const items = dataSourceData || props.items || [];
      if (loadingData) {
        return <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 12 }} />;
      }
      return (
        <View style={[styles.listContainer, style]}>
          {items.map((item: any, idx: number) => (
            <TouchableOpacity
              key={item.id || idx}
              activeOpacity={0.7}
              onPress={() => {
                if (props.itemAction) {
                  const resolvedAction = {
                    ...props.itemAction,
                    params: { ...props.itemAction.params, id: item.id },
                  };
                  handleAction(resolvedAction, navigation, onRefresh);
                }
              }}
              style={styles.listItem}
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.listItemImage} resizeMode="cover" />
              )}
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.title || item.name || 'Item'}</Text>
                {(item.subtitle || item.description) && (
                  <Text style={styles.listItemSubtitle}>{item.subtitle || item.description}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    case 'grid': {
      const items = dataSourceData || props.items || [];
      const columns = props.columns || 2;
      const itemWidth = (SCREEN_WIDTH - 32 - (columns - 1) * 12) / columns;

      return (
        <View style={[styles.gridContainer, style]}>
          {items.map((item: any, idx: number) => (
            <TouchableOpacity
              key={item.id || idx}
              activeOpacity={0.8}
              style={[styles.gridItem, { width: itemWidth }]}
              onPress={() => {
                if (props.itemAction) {
                  const resolvedAction = {
                    ...props.itemAction,
                    params: { ...props.itemAction.params, id: item.id },
                  };
                  handleAction(resolvedAction, navigation, onRefresh);
                }
              }}
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.gridItemImage} resizeMode="cover" />
              )}
              <View style={styles.gridItemContent}>
                <Text style={styles.gridItemTitle} numberOfLines={1}>
                  {item.title || item.name}
                </Text>
                {item.subtitle && (
                  <Text style={styles.gridItemSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    case 'carousel': {
      const items = props.items || [];
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.carouselContainer, style]}
        >
          {items.map((item: any, idx: number) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => handleAction(item.action, navigation, onRefresh)}
              style={styles.carouselItem}
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.carouselImage} resizeMode="cover" />
              )}
              {item.title && <Text style={styles.carouselTitle}>{item.title}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    case 'divider':
      return (
        <View
          style={[
            styles.divider,
            props.color && { backgroundColor: props.color },
            props.thickness && { height: props.thickness },
            style,
          ]}
        />
      );

    case 'spacer':
      return <View style={[{ height: props.height || 16 }, style]} />;

    case 'avatar':
      return (
        <View style={[styles.avatarContainer, style]}>
          {props.src || props.image ? (
            <Image
              source={{ uri: props.src || props.image }}
              style={[
                styles.avatar,
                props.size && { width: props.size, height: props.size, borderRadius: props.size / 2 },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                props.size && { width: props.size, height: props.size, borderRadius: props.size / 2 },
              ]}
            >
              <Ionicons name="person" size={props.size ? props.size * 0.5 : 24} color="#9ca3af" />
            </View>
          )}
          {props.name && <Text style={styles.avatarName}>{props.name}</Text>}
        </View>
      );

    case 'badge':
      return (
        <View
          style={[
            styles.badge,
            props.bgColor && { backgroundColor: props.bgColor },
            style,
          ]}
        >
          <Text style={[styles.badgeText, props.textColor && { color: props.textColor }]}>
            {props.text || props.label}
          </Text>
        </View>
      );

    case 'form':
      return (
        <DynamicForm
          formSlug={props.form_slug || props.slug}
          formConfig={props.form_config}
          onSubmitSuccess={onRefresh}
        />
      );

    case 'webview':
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleAction({ type: 'external_url', url: props.url }, navigation)}
          style={[styles.webviewFallback, style]}
        >
          <Ionicons name="globe-outline" size={24} color="#2563eb" />
          <Text style={styles.webviewText}>{props.title || 'Open Web Page'}</Text>
          <Ionicons name="open-outline" size={16} color="#6b7280" />
        </TouchableOpacity>
      );

    default:
      return (
        <View style={styles.unknownComponent}>
          <Text style={styles.unknownText}>Component [{type}]</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 8,
  },
  headingSmall: {
    fontSize: 18,
  },
  headingLarge: {
    fontSize: 28,
  },
  bodyText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginVertical: 4,
  },
  bannerContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#e5e7eb',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 2,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
    lineHeight: 20,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 200,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
  },
  buttonSecondary: {
    backgroundColor: '#4b5563',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonOutlineText: {
    color: '#2563eb',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  gridItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: 110,
  },
  gridItemContent: {
    padding: 10,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  gridItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  carouselContainer: {
    paddingVertical: 10,
    gap: 12,
  },
  carouselItem: {
    width: 150,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: 100,
  },
  carouselTitle: {
    fontSize: 13,
    fontWeight: '600',
    padding: 8,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 4,
  },
  badgeText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
  },
  webviewFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  webviewText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  unknownComponent: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginVertical: 4,
  },
  unknownText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
