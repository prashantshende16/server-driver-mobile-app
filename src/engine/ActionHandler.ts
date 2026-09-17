import { Alert, Linking, Share } from 'react-native';
import { MobileAPI } from '../config/api';

export interface ActionDefinition {
  type: string;
  page?: string;
  params?: Record<string, any>;
  url?: string;
  endpoint?: string;
  method?: string;
  body?: Record<string, any>;
  phone?: string;
  email?: string;
  subject?: string;
  title?: string;
  message?: string;
}

export const handleAction = async (
  action: ActionDefinition | null | undefined,
  navigation?: any,
  onRefresh?: () => void
) => {
  if (!action || !action.type) return;

  switch (action.type) {
    case 'navigate': {
      if (action.page && navigation) {
        navigation.navigate('DynamicPage', {
          slug: action.page,
          title: action.title || action.page,
          params: action.params,
        });
      }
      break;
    }

    case 'api': {
      if (action.endpoint) {
        try {
          await MobileAPI.submitAction(action.endpoint, action.method || 'POST', action.body || {});
          Alert.alert('Success', action.message || 'Action performed successfully');
          if (onRefresh) onRefresh();
        } catch (e: any) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to perform action');
        }
      }
      break;
    }

    case 'external_url':
    case 'webview': {
      if (action.url) {
        const canOpen = await Linking.canOpenURL(action.url);
        if (canOpen) {
          await Linking.openURL(action.url);
        } else {
          Alert.alert('Cannot Open URL', action.url);
        }
      }
      break;
    }

    case 'phone': {
      if (action.phone) {
        await Linking.openURL(`tel:${action.phone}`);
      }
      break;
    }

    case 'email': {
      if (action.email) {
        const mailto = `mailto:${action.email}${action.subject ? `?subject=${encodeURIComponent(action.subject)}` : ''}`;
        await Linking.openURL(mailto);
      }
      break;
    }

    case 'share': {
      if (action.message) {
        await Share.share({
          message: action.message,
          title: action.title,
        });
      }
      break;
    }

    case 'modal': {
      Alert.alert(action.title || 'Notification', action.message || '');
      break;
    }

    case 'refresh': {
      if (onRefresh) onRefresh();
      break;
    }

    case 'logout': {
      Alert.alert('Logged Out', 'You have been signed out.');
      break;
    }

    default:
      console.warn(`[FlowForge] Unhandled action type: ${action.type}`);
  }
};
