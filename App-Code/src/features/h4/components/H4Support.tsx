import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Text } from 'react-native';
import { LifeBuoy, Send, PlusCircle, ChevronRight, MessageSquare, Award } from 'lucide-react-native';
import { theme } from '@/design-system/theme';
import { Typography, Card, Badge, Modal } from '@/components/ui';
import { API_CLIENT } from '@/lib/api-client';
import { H4TopHeader } from './H4TopHeader';
import { fontFamilies } from '@/design-system/tokens';

interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  messages: TicketMessage[];
  createdAt: string;
}

export function H4Support() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API_CLIENT.get('/tickets');
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setTickets(data);
        if (activeTicket) {
          const updated = data.find((t: Ticket) => t.id === activeTicket.id);
          if (updated) setActiveTicket(updated);
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch tickets:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [activeTicket]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please fill in both subject and message.');
      return;
    }

    try {
      setSubmitting(true);
      await API_CLIENT.post('/tickets', {
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      Alert.alert('Ticket Created', 'Your support ticket has been submitted successfully.');
      setSubject('');
      setMessage('');
      setCreateModalOpen(false);
      await fetchTickets();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not create ticket';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyMessage.trim()) return;

    try {
      setReplying(true);
      const res = await API_CLIENT.post(`/tickets/${activeTicket.id}/reply`, {
        message: replyMessage.trim(),
      });
      setReplyMessage('');
      if (res.data?.data) {
        setActiveTicket(res.data.data);
      }
      await fetchTickets();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not send reply';
      Alert.alert('Error', msg);
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <H4TopHeader title="Support Desk" />
      <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerGroup}>
          <View style={styles.headerIconWrap}>
            <LifeBuoy size={18} color={theme.colors.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="h2" style={styles.headerTitle}>H4 Help Center</Typography>
            <Typography variant="caption" color="secondary" style={styles.headerSub}>
              Raise tickets & resolve questions with your coach or H4 support
            </Typography>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalOpen(true)} activeOpacity={0.85}>
            <PlusCircle size={14} color={theme.colors.card} style={{ marginRight: 4 }} />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {tickets.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <LifeBuoy size={28} color={theme.colors.primary} />
            </View>
            <Typography variant="bodySm" style={styles.emptyTitle}>No Support Tickets</Typography>
            <Typography variant="caption" color="secondary" style={styles.emptyDesc}>
              Need assistance with your membership, billing, or trainer plan? Click "New Ticket" to send a query.
            </Typography>
          </Card>
        ) : (
          <View style={styles.ticketList}>
            {tickets.map((t) => (
              <TouchableOpacity key={t.id} activeOpacity={0.9} onPress={() => setActiveTicket(t)}>
                <View style={styles.ticketCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text style={styles.ticketSubject} numberOfLines={1}>{t.subject}</Text>
                      <Text style={styles.ticketCategory}>Category: {t.category}</Text>
                    </View>
                    <Badge label={t.status} variant={t.status === 'resolved' ? 'active' : 'info'} />
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MessageSquare size={13} color={theme.colors.textSecondary} />
                      <Text style={styles.messageCountText}>
                        {t.messages?.length || 0} Message{(t.messages?.length || 0) === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={theme.colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* New Ticket Modal */}
        <Modal visible={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Support Ticket">
          <View style={styles.modalForm}>
            <Text style={styles.inputLabel}>SUBJECT</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Question about membership renewal"
              placeholderTextColor={theme.colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.categoryRow}>
              {['General', 'Billing', 'Workout', 'Branch'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>MESSAGE</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTicket} disabled={submitting} activeOpacity={0.85}>
              {submitting ? (
                <ActivityIndicator color={theme.colors.card} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Ticket Details & Thread Modal */}
        <Modal visible={!!activeTicket} onClose={() => setActiveTicket(null)} title={activeTicket?.subject || 'Ticket Details'}>
          {activeTicket ? (
            <View style={styles.threadContainer}>
              <View style={styles.threadHeader}>
                <Badge label={activeTicket.status} variant={activeTicket.status === 'resolved' ? 'active' : 'info'} />
                <Text style={styles.threadCategoryText}>Category: {activeTicket.category}</Text>
              </View>

              <ScrollView style={styles.messagesScroll} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
                {activeTicket.messages?.map((msg) => {
                  const isUser = msg.senderRole === 'member';
                  return (
                    <View key={msg.id} style={[styles.msgBubble, isUser ? styles.msgUser : styles.msgSupport]}>
                      <Text style={[styles.msgSender, isUser ? { color: theme.colors.warning } : { color: theme.colors.info }]}>
                        {msg.senderName} ({msg.senderRole})
                      </Text>
                      <Text style={styles.msgText}>{msg.message}</Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.replyBox}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Type your reply..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={replyMessage}
                  onChangeText={setReplyMessage}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendReply} disabled={replying} activeOpacity={0.85}>
                  {replying ? (
                    <ActivityIndicator color={theme.colors.card} size="small" />
                  ) : (
                    <Send size={15} color={theme.colors.card} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingBottom: 100, gap: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  
  headerGroup: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 4 
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    color: theme.colors.text, 
    fontWeight: '800', 
    fontSize: 20 
  },
  headerSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  createBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  createBtnText: { color: theme.colors.card, fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },

  emptyCard: { 
    padding: 30, 
    alignItems: 'center', 
    gap: 10, 
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(240, 160, 32, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 16 },
  emptyDesc: { textAlign: 'center', fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
  
  ticketList: { gap: 14 },
  ticketCard: { 
    padding: 16, 
    gap: 12, 
    borderRadius: 20,
    backgroundColor: theme.colors.card, 
    borderColor: theme.colors.border, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  ticketSubject: { color: theme.colors.text, fontWeight: '800', fontSize: 15 },
  ticketCategory: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  messageCountText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '700' },
  
  modalForm: { gap: 10 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.textSecondary, letterSpacing: 0.5 },
  input: { 
    backgroundColor: theme.colors.background, 
    color: theme.colors.text, 
    paddingHorizontal: 12, 
    height: 46,
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    fontSize: 13,
    fontFamily: fontFamilies.body,
  },
  textArea: { height: 90, textAlignVertical: 'top', paddingVertical: 12 },
  categoryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  catChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  catChipText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  catChipTextActive: { color: theme.colors.card },
  
  submitBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 6 
  },
  submitBtnText: { color: theme.colors.card, fontWeight: '800', fontSize: 14 },
  
  threadContainer: { gap: 12, maxHeight: 400 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadCategoryText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  messagesScroll: { maxHeight: 260 },
  msgBubble: { padding: 12, borderRadius: 12, gap: 4, marginVertical: 3 },
  msgUser: { backgroundColor: 'rgba(240, 160, 32, 0.08)', alignSelf: 'flex-end', width: '85%', borderWidth: 1, borderColor: 'rgba(240, 160, 32, 0.15)' },
  msgSupport: { backgroundColor: theme.colors.background, alignSelf: 'flex-start', width: '85%', borderWidth: 1, borderColor: theme.colors.border },
  msgSender: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  msgText: { color: theme.colors.text, fontSize: 13, lineHeight: 18 },
  replyBox: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 6 },
  replyInput: { 
    flex: 1, 
    backgroundColor: theme.colors.background, 
    color: theme.colors.text, 
    paddingHorizontal: 12, 
    height: 42,
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    fontSize: 13 
  },
  sendBtn: { 
    backgroundColor: theme.colors.primary, 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});
