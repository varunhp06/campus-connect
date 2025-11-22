import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceLayout } from '@/components/ServiceLayout';
import { useTheme } from '@/components/ThemeContext';
import HapticPressable from '@/components/HapticPressable';
import { db } from '@/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function AddFAQ() {
  const { theme } = useTheme();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Error', 'Please fill in both question and answer');
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'faqs'), {
        question: question.trim(),
        answer: answer.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Alert.alert(
        'Success',
        'FAQ added successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setQuestion('');
              setAnswer('');
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding FAQ:', error);
      Alert.alert('Error', 'Failed to add FAQ. Please try again.');
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
        icon='add-circle'
        title="Add New FAQ"
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
              <Text style={[styles.label, { color: theme.text }]}>Question</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }]}
                value={question}
                onChangeText={setQuestion}
                placeholder="Enter the question"
                placeholderTextColor={theme.placeholder}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.label, { color: theme.text }]}>Answer</Text>
              <TextInput
                style={[styles.input, styles.answerInput, { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }]}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Enter the answer"
                placeholderTextColor={theme.placeholder}
                multiline
                numberOfLines={8}
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
                    {submitting ? 'Adding...' : 'Add FAQ'}
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
    textAlignVertical: 'top',
  },
  answerInput: {
    minHeight: 180,
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
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});