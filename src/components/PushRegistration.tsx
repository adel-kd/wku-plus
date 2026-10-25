import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export function PushRegistration() {
  const { profile } = useAuth();
  useEffect(() => {
    if (!profile || Platform.OS === 'web' || !Device.isDevice) return;
    let active = true;
    (async () => {
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('announcements', { name: 'Announcements', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
      const current = await Notifications.getPermissionsAsync();
      const permission = current.status === 'granted' ? current.status : (await Notifications.requestPermissionsAsync()).status;
      if (permission !== 'granted' || !active) return;
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (active) await api.registerPushToken(token, Platform.OS);
    })().catch(() => undefined);
    return () => { active = false; };
  }, [profile?.id]);
  return null;
}
