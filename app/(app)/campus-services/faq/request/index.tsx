import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceLayout } from '@/components/ServiceLayout';
import { useTheme } from '@/components/ThemeContext';
import HapticPressable from '@/components/HapticPressable';
import { db, auth } from '@/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function RequestFAQ() {
  const { theme } = useTheme();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a request');
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'faqRequests'), {
        question: question.trim(),
        requestedBy: user.email || 'Anonymous',
        requestedAt: new Date(),
      });

      Alert.alert(
        'Success',
        'Your question has been submitted. An admin will review and answer it soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              setQuestion('');
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit your question. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        icon='chatbubble-ellipses'
        title="Request FAQ"
        showBottomImage={false}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.form}>
              <View style={[styles.infoBox, { 
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder
              }]}>
                <Text style={[styles.infoText, { color: theme.placeholder }]}>
                  Have a question that's not in our FAQ? Submit it here and our team will review and add it to the FAQ section.
                </Text>
              </View>

              <Text style={[styles.label, { color: theme.text }]}>Your Question</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }]}
                value={question}
                onChangeText={setQuestion}
                placeholder="What would you like to know?"
                placeholderTextColor={theme.placeholder}
                multiline
                numberOfLines={6}
              />

              <View style={styles.buttonContainer}>
                <HapticPressable
                  onPress={() => router.back()}
                  style={[styles.button, styles.cancelButton, { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder 
                  }]}
                  disabled={submitting}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
                </HapticPressable>

                <HapticPressable
                  onPress={handleSubmit}
                  style={[styles.button, styles.submitButton]}
                  disabled={submitting}
                >
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Text>
                </HapticPressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  form: {
    paddingTop: 10,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    marginBottom: 20,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});