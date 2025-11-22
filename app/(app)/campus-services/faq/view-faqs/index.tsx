import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceLayout } from '@/components/ServiceLayout';
import { useTheme } from '@/components/ThemeContext';
import HapticPressable from '@/components/HapticPressable';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@/firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  createdAt: any;
  updatedAt: any;
}

export default function ViewFAQs() {
  const { theme } = useTheme();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFaqAdmin, setIsFaqAdmin] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  useEffect(() => {
    checkAdminAndLoadFAQs();
  }, []);

  const checkAdminAndLoadFAQs = async () => {
    const user = auth.currentUser;
    if (user) {
      const tokenResult = await user.getIdTokenResult();
      setIsFaqAdmin(tokenResult.claims.faqAdmin === true);
    }
    await loadFAQs();
  };

  const loadFAQs = async () => {
    try {
      const faqsSnapshot = await getDocs(collection(db, 'faqs'));
      const faqsData = faqsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FAQ[];
      setFaqs(faqsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (error) {
      console.error('Error loading FAQs:', error);
      Alert.alert('Error', 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFaq || !editQuestion.trim() || !editAnswer.trim()) {
      Alert.alert('Error', 'Question and answer are required');
      return;
    }

    try {
      const faqRef = doc(db, 'faqs', editingFaq.id);
      await updateDoc(faqRef, {
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
        updatedAt: new Date()
      });

      setFaqs(faqs.map(faq => 
        faq.id === editingFaq.id 
          ? { ...faq, question: editQuestion.trim(), answer: editAnswer.trim() }
          : faq
      ));

      setEditModalVisible(false);
      setEditingFaq(null);
      Alert.alert('Success', 'FAQ updated successfully');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      Alert.alert('Error', 'Failed to update FAQ');
    }
  };

  const handleDelete = (faq: FAQ) => {
    Alert.alert(
      'Delete FAQ',
      'Are you sure you want to delete this FAQ?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'faqs', faq.id));
              setFaqs(faqs.filter(f => f.id !== faq.id));
              Alert.alert('Success', 'FAQ deleted successfully');
            } catch (error) {
              console.error('Error deleting FAQ:', error);
              Alert.alert('Error', 'Failed to delete FAQ');
            }
          }
        }
      ]
    );
  };

  const renderFAQ = ({ item }: { item: FAQ }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={[styles.faqCard, { 
        backgroundColor: theme.inputBackground, 
        borderColor: theme.inputBorder 
      }]}>
        <HapticPressable
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          style={styles.faqHeader}
        >
          <View style={styles.faqHeaderContent}>
            <Ionicons 
              name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
              size={20} 
              color={theme.text}
              style={styles.chevron}
            />
            <Text style={[styles.question, { color: theme.text }]}>
              {item.question}
            </Text>
          </View>
        </HapticPressable>

        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={[styles.answer, { color: theme.placeholder }]}>
              {item.answer}
            </Text>
            
            {isFaqAdmin && (
              <View style={styles.adminActions}>
                <HapticPressable
                  onPress={() => handleEdit(item)}
                  style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </HapticPressable>

                <HapticPressable
                  onPress={() => handleDelete(item)}
                  style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </HapticPressable>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

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
        icon='help-circle'
        title="View FAQs"
        showBottomImage={false}
      >
        <View style={styles.container}>
          {loading ? (
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
              Loading FAQs...
            </Text>
          ) : faqs.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
              No FAQs available yet
            </Text>
          ) : (
            <FlatList
              data={faqs}
              renderItem={renderFAQ}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>

        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit FAQ</Text>
                <HapticPressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </HapticPressable>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.label, { color: theme.text }]}>Question</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text
                  }]}
                  value={editQuestion}
                  onChangeText={setEditQuestion}
                  placeholder="Enter question"
                  placeholderTextColor={theme.placeholder}
                  multiline
                />

                <Text style={[styles.label, { color: theme.text }]}>Answer</Text>
                <TextInput
                  style={[styles.input, styles.answerInput, { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text
                  }]}
                  value={editAnswer}
                  onChangeText={setEditAnswer}
                  placeholder="Enter answer"
                  placeholderTextColor={theme.placeholder}
                  multiline
                  numberOfLines={6}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <HapticPressable
                  onPress={() => setEditModalVisible(false)}
                  style={[styles.modalButton, { backgroundColor: theme.inputBorder }]}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </HapticPressable>

                <HapticPressable
                  onPress={handleSaveEdit}
                  style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
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
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    padding: 16,
  },
  faqHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginRight: 12,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 32,
  },
  adminActions: {
    flexDirection: 'row',
    marginTop: 12,
    marginLeft: 32,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  answerInput: {
    minHeight: 120,
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