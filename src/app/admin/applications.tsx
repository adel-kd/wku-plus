import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, EmptyState, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { MerchantApplication } from '@/lib/types';
import { colors } from '@/theme';

export default function AdminApplications() {
  const [apps, setApps] = useState<MerchantApplication[]>([]);
  const load = useCallback(() => api.listApplications().then(setApps), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <PageHeader title="Merchant applications" subtitle="Approve students to open a Gebeya shop" />
      <FlatList
        data={apps}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<EmptyState title="No applications yet" />}
        renderItem={({ item }) => (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', color: colors.ink }}>{item.shopName}</Text>
              <Badge
                label={item.status}
                tone={item.status === 'pending' ? 'warn' : item.status === 'approved' ? 'success' : 'danger'}
              />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{item.userName} · {item.userPhone}</Text>
            <Text style={{ color: colors.ink, fontSize: 13 }}>{item.description}</Text>
            {item.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="Approve" small onPress={() => api.decideApplication(item.id, true).then(load)} />
                <Button label="Reject" small variant="danger" onPress={() => api.decideApplication(item.id, false).then(load)} />
              </View>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
