import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceLayout } from '@/components/ServiceLayout';
import { useTheme } from '@/components/ThemeContext';
import HapticPressable from '@/components/HapticPressable';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, addDoc } from 'firebase/firestore';

interface FAQRequest {
  id: string;
  question: string;
  requestedBy: string;
  requestedAt: any;
}

export default function ViewRequests() {
  const { theme } = useTheme();
  const [requests, setRequests] = useState<FAQRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerModalVisible, setAnswerModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FAQRequest | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const requestsSnapshot = await getDocs(collection(db, 'faqRequests'));
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FAQRequest[];
      setRequests(requestsData.sort((a, b) => b.requestedAt?.seconds - a.requestedAt?.seconds));
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load FAQ requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerRequest = (request: FAQRequest) => {
    setSelectedRequest(request);
    setAnswer('');
    setAnswerModalVisible(true);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedRequest || !answer.trim()) {
      Alert.alert('Error', 'Please provide an answer');
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'faqs'), {
        question: selectedRequest.question,
        answer: answer.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await deleteDoc(doc(db, 'faqRequests', selectedRequest.id));

      setRequests(requests.filter(r => r.id !== selectedRequest.id));
      setAnswerModalVisible(false);
      setSelectedRequest(null);
      setAnswer('');
      
      Alert.alert('Success', 'FAQ answered and published successfully');
    } catch (error) {
      console.error('Error answering request:', error);
      Alert.alert('Error', 'Failed to answer request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = (request: FAQRequest) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'faqRequests', request.id));
              setRequests(requests.filter(r => r.id !== request.id));
              Alert.alert('Success', 'Request deleted successfully');
            } catch (error) {
              console.error('Error deleting request:', error);
              Alert.alert('Error', 'Failed to delete request');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRequest = ({ item }: { item: FAQRequest }) => (
    <View style={[styles.requestCard, { 
      backgroundColor: theme.inputBackground, 
      borderColor: theme.inputBorder 
    }]}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={[styles.question, { color: theme.text }]}>
            {item.question}
          </Text>
          <Text style={[styles.metadata, { color: theme.placeholder }]}>
            Requested by {item.requestedBy || 'Anonymous'}
          </Text>
          <Text style={[styles.metadata, { color: theme.placeholder }]}>
            {formatDate(item.requestedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <HapticPressable
          onPress={() => handleAnswerRequest(item)}
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
        >
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Answer</Text>
        </HapticPressable>

        <HapticPressable
          onPress={() => handleDeleteRequest(item)}
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </HapticPressable>
      </View>
    </View>
  );

  return (
    <ThemedLayout 
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <ServiceLayout
        icon='document-text'
        title="FAQ Requests"
        showBottomImage={false}
      >
        <View style={styles.container}>
          {loading ? (
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
              Loading requests...
            </Text>
          ) : requests.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
              No pending requests
            </Text>
          ) : (
            <FlatList
              data={requests}
              renderItem={renderRequest}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>

        <Modal
          visible={answerModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAnswerModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Answer Question</Text>
                <HapticPressable onPress={() => setAnswerModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </HapticPressable>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.label, { color: theme.text }]}>Question</Text>
                <View style={[styles.questionDisplay, { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder
                }]}>
                  <Text style={[styles.questionText, { color: theme.text }]}>
                    {selectedRequest?.question}
                  </Text>
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Your Answer</Text>
                <TextInput
                  style={[styles.input, styles.answerInput, { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text
                  }]}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Enter your answer"
                  placeholderTextColor={theme.placeholder}
                  multiline
                  numberOfLines={8}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <HapticPressable
                  onPress={() => setAnswerModalVisible(false)}
                  style={[styles.modalButton, { backgroundColor: theme.inputBorder }]}
                  disabled={submitting}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </HapticPressable>

                <HapticPressable
                  onPress={handleSubmitAnswer}
                  style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                  disabled={submitting}
                >
                  <Text style={styles.modalButtonText}>
                    {submitting ? 'Publishing...' : 'Publish'}
                  </Text>
                </HapticPressable>
              </View>
            </View>
          </View>
        </Modal>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  requestCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  metadata: {
    fontSize: 12,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  questionDisplay: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  answerInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});