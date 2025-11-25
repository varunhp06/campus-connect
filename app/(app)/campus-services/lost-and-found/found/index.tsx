// screens/FoundItems.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth } from '@/firebaseConfig';
import {
  createFoundItem,
  subscribeFoundItems,
  claimFoundItem,
  removeFoundItem,
} from '@/components/data/lostAndFoundService';
import { FoundItem, CreateFoundItemData } from '@/components/data/lostAndFound';
import { ServiceLayout } from '@/components/ServiceLayout';
import { ThemedLayout } from '@/components/ThemedLayout';
import { useTheme } from '@/components/ThemeContext';
import HapticPressable from '@/components/HapticPressable';

export default function FoundItemsScreen() {
  const { theme, isDarkMode } = useTheme();
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);

  // Form state
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [dateFound, setDateFound] = useState(new Date());
  const [timeFound, setTimeFound] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const unsubscribe = subscribeFoundItems((fetchedItems) => {
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!itemName || !description || !location || !imageUri || !timeFound) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Combine date and time for validation
    const selectedDateTime = new Date(dateFound);
    selectedDateTime.setHours(timeFound.getHours());
    selectedDateTime.setMinutes(timeFound.getMinutes());

    if (selectedDateTime > new Date()) {
        Alert.alert('Error', 'Date and time cannot be in the future');
        return;
    }

    if (!currentUser || !currentUser.email) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setSubmitting(true);

    try {
      const timeString = timeFound.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const data: CreateFoundItemData = {
        itemName,
        description,
        foundLocation: location,
        imageUri,
        dateFound,
        timeFound: timeString,
      };

      const userPhone = '';

      await createFoundItem(data, currentUser.uid, currentUser.email, userPhone);

      Alert.alert('Success', 'Found item posted successfully');
      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to post found item');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setItemName('');
    setDescription('');
    setLocation('');
    setImageUri('');
    setDateFound(new Date());
    setTimeFound(new Date());
  };

  const handleClaimItem = async (item: FoundItem) => {
    if (!currentUser || !currentUser.email) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    if (item.userId === currentUser.uid) {
      Alert.alert('Error', 'You cannot claim your own found item');
      return;
    }

    Alert.alert(
      'Claim Item',
      `Claim that ${item.itemName} is yours?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              const userPhone = '';
              await claimFoundItem(
                item.id,
                currentUser.uid,
                currentUser.email!,
                userPhone,
                item
              );
              Alert.alert(
                'Success',
                `You can now contact ${item.userEmail} at ${item.userPhone}`
              );
              setDetailModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to claim item');
            }
          },
        },
      ]
    );
  };

  const handleRemove = async (item: FoundItem) => {
    Alert.alert(
      'Remove Item',
      'Have you found the original owner yourself?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFoundItem(item.id, item.cloudinaryPublicId);
              Alert.alert('Success', 'Item removed');
              setDetailModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: FoundItem }) => (
    <HapticPressable
      style={[styles.card, { backgroundColor: theme.inputBackground }]}
      onPress={() => {
        setSelectedItem(item);
        setDetailModalVisible(true);
      }}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardContent}>
          <Text style={[styles.itemName, { color: theme.primaryText }]}>
            {item.itemName}
          </Text>
          <Text style={[styles.location, { color: theme.placeholder }]}>
            📍 {item.foundLocation}
          </Text>
          <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={[styles.date, { color: theme.placeholder }]}>
            🕒 {item.dateFound.toLocaleDateString()} at {item.timeFound}
          </Text>
        </View>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        )}
      </View>
    </HapticPressable>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  }

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
        icon={"cube"}
        title={"Found Items"}
        showTitle={true}
        showBottomImage={false}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                No found items reported
              </Text>
            }
          />

          <HapticPressable
            style={styles.fab}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.fabText}>+</Text>
          </HapticPressable>

          {/* Create Modal */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <ScrollView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>
                Report Found Item
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Item Name"
                placeholderTextColor={theme.placeholder}
                value={itemName}
                onChangeText={setItemName}
              />

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Description"
                placeholderTextColor={theme.placeholder}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Where You Found It"
                placeholderTextColor={theme.placeholder}
                value={location}
                onChangeText={setLocation}
              />

              <HapticPressable
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: theme.text }}>
                  Date Found: {dateFound.toLocaleDateString()}
                </Text>
              </HapticPressable>

              {showDatePicker && (
                <DateTimePicker
                  value={dateFound}
                  mode="date"
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setDateFound(date);
                  }}
                />
              )}

              <HapticPressable
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: theme.text }}>
                  Time Found: {timeFound.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </HapticPressable>

              {showTimePicker && (
                <DateTimePicker
                  value={timeFound}
                  mode="time"
                  onChange={(event, date) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (date) setTimeFound(date);
                  }}
                />
              )}

              <HapticPressable style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonText}>
                  {imageUri ? 'Change Image' : 'Pick Image'}
                </Text>
              </HapticPressable>

              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              )}

              <HapticPressable
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Text>
              </HapticPressable>

              <HapticPressable
                style={[
                  styles.cancelButton,
                  { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                ]}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </HapticPressable>
            </ScrollView>
          </Modal>

          {/* Detail Modal */}
          <Modal
            visible={detailModalVisible}
            animationType="slide"
            onRequestClose={() => setDetailModalVisible(false)}
          >
            {selectedItem && (
              <ScrollView style={[styles.detailContainer, { backgroundColor: theme.background }]}>
                <Image
                  source={{ uri: selectedItem.imageUrl }}
                  style={styles.detailImage}
                />
                <Text style={[styles.detailTitle, { color: theme.primaryText }]}>
                  {selectedItem.itemName}
                </Text>
                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>
                  Description:
                </Text>
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {selectedItem.description}
                </Text>
                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>
                  Found Location:
                </Text>
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {selectedItem.foundLocation}
                </Text>
                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>
                  Date & Time:
                </Text>
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {selectedItem.dateFound.toLocaleDateString()} at{' '}
                  {selectedItem.timeFound}
                </Text>

                {selectedItem.userId === currentUser?.uid ? (
                  <HapticPressable
                    style={styles.removeButton}
                    onPress={() => handleRemove(selectedItem)}
                  >
                    <Text style={styles.removeButtonText}>
                      Remove (Found Owner Myself)
                    </Text>
                  </HapticPressable>
                ) : (
                  <HapticPressable
                    style={styles.claimButton}
                    onPress={() => handleClaimItem(selectedItem)}
                  >
                    <Text style={styles.claimButtonText}>This Is My Item</Text>
                  </HapticPressable>
                )}

                <HapticPressable
                  style={[
                    styles.closeButton,
                    { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' },
                  ]}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={[styles.closeButtonText, { color: theme.text }]}>
                    Close
                  </Text>
                </HapticPressable>
              </ScrollView>
            )}
          </Modal>
        </View>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    marginRight: '5%'
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 40,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  imageButton: {
    backgroundColor: '#FF9500',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailContainer: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: 300,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 24,
    paddingBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  detailText: {
    fontSize: 16,
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 8,
  },
  claimButton: {
    backgroundColor: '#FF9500',
    margin: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    margin: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    margin: 24,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});