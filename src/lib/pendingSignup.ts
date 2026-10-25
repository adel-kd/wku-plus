import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'wku-plus-pending-signup';

export interface PendingSignup {
  phone: string;
  fullName: string;
  department: string;
  password: string;
}

export async function savePendingSignup(value: PendingSignup) {
  const data = JSON.stringify(value);
  if (Platform.OS === 'web') {
    globalThis.sessionStorage?.setItem(KEY, data);
    return;
  }
  await SecureStore.setItemAsync(KEY, data);
}

export async function readPendingSignup(): Promise<PendingSignup | null> {
  const data = Platform.OS === 'web'
    ? globalThis.sessionStorage?.getItem(KEY) ?? null
    : await SecureStore.getItemAsync(KEY);
  return data ? JSON.parse(data) : null;
}

export async function clearPendingSignup() {
  if (Platform.OS === 'web') {
    globalThis.sessionStorage?.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
