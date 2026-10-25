import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { Profile, Role } from '@/lib/types';
import { colors, radius } from '@/theme';
import { useAuth } from '@/lib/auth';

const ROLES: Role[] = ['student', 'merchant', 'runner', 'admin'];

export default function AdminUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const load = useCallback(() => api.listUsers().then(setUsers), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <PageHeader title="Users & roles" subtitle={`${users.length} accounts`} />
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>{item.fullName || item.phone}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{item.phone}{item.studentId ? ` · ${item.studentId}` : ''}</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {ROLES.map((r) => (
                <Pressable
                  key={r}
                  disabled={item.id === profile?.id && r !== 'admin'}
                  onPress={() => api.setRole(item.id, r).then(load)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: item.role === r ? colors.primary : colors.bg,
                    opacity: item.id === profile?.id && r !== 'admin' ? 0.35 : 1,
                    borderWidth: 1,
                    borderColor: item.role === r ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: item.role === r ? '#fff' : colors.muted }}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
