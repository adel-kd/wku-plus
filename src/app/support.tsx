import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { colors } from '@/theme';

export default function Support() {
  const { profile } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    const clean = message.trim();
    if (!clean || !profile) return;
    setSending(true);
    const { error } = await supabase.from('support_messages').insert({
      user_id: profile.id, user_name: profile.fullName || profile.username,
      user_phone: profile.phone, message: clean,
    });
    setSending(false);
    if (error) return Alert.alert('Could not send', error.message);
    setMessage('');
    Alert.alert('Message sent', 'The WKU+ admin team can now see your message.');
  }

  return <Screen>
    <PageHeader title="Contact admin" subtitle="Send a private message to the WKU+ team" />
    <View style={styles.body}>
      <View style={styles.icon}><Ionicons name="chatbox-ellipses-outline" size={28} color={colors.primaryDark} /></View>
      <Text style={styles.title}>How can we help?</Text>
      <Text style={styles.copy}>Your name and phone number are included so an administrator can identify your account.</Text>
      <TextInput value={message} onChangeText={setMessage} multiline maxLength={2000} placeholder="Write your message here" placeholderTextColor={colors.muted} style={styles.input} />
      <Pressable onPress={send} disabled={sending || !message.trim()} style={({ pressed }) => [styles.button, (pressed || sending || !message.trim()) && { opacity: .6 }]}>
        <Text style={styles.buttonText}>{sending ? 'Sending…' : 'Send to admin'}</Text>
      </Pressable>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  body: { padding: 20, alignItems: 'center' }, icon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#EAF7FD', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21, fontWeight: '800', color: colors.ink, marginTop: 14 }, copy: { color: colors.muted, lineHeight: 20, textAlign: 'center', marginTop: 6, maxWidth: 420 },
  input: { width: '100%', maxWidth: 520, minHeight: 160, marginTop: 22, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, color: colors.ink, textAlignVertical: 'top', backgroundColor: '#FFF' },
  button: { width: '100%', maxWidth: 520, backgroundColor: colors.primaryDark, borderRadius: 15, padding: 15, alignItems: 'center', marginTop: 14 }, buttonText: { color: '#FFF', fontWeight: '800' },
});
