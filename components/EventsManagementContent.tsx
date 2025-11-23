import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { auth, db } from '@/firebaseConfig';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import HapticPressable from './HapticPressable';
import { ServiceLayout } from './ServiceLayout';

export const checkUserHasEventManagementAccess = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const idTokenResult = await user.getIdTokenResult();
    const claims = idTokenResult.claims;
    
    return !!(
      claims.sportsAdmin ||
      claims.cultAdmin ||
      claims.techAdmin ||
      claims.sportsCoordinator ||
      claims.cultCoordinator ||
      claims.techCoordinator
    );
  } catch (error) {
    console.error('Error checking event management access:', error);
    return false;
  }
};

interface Event {
  id: string;
  title: string;
  description: string;
  date: number;
  month: string;
  year: number;
  timestamp: number; 
  tab: 'SPORTS' | 'CULT' | 'TECH';
}

interface EventRequest extends Event {
  requestedBy: string;
  requestedAt: number;
}

interface UserClaims {
  sportsAdmin?: boolean;
  cultAdmin?: boolean;
  techAdmin?: boolean;
  sportsCoordinator?: boolean;
  cultCoordinator?: boolean;
  techCoordinator?: boolean;
}

type TabType = 'SPORTS' | 'CULT' | 'TECH';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const currentYear = new Date().getFullYear();
const YEARS = [currentYear.toString(), (currentYear + 1).toString()];

export const EventsManagementContent: React.FC = () => {
  const { theme } = useTheme();
  const [userClaims, setUserClaims] = useState<UserClaims>({});
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType | null>(null);
  const [availableTabs, setAvailableTabs] = useState<TabType[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    const checkUserClaims = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const idTokenResult = await user.getIdTokenResult();
          const claims = idTokenResult.claims as UserClaims;
          setUserClaims(claims);

          const tabs: TabType[] = [];
          if (claims.sportsAdmin || claims.sportsCoordinator) tabs.push('SPORTS');
          if (claims.cultAdmin || claims.cultCoordinator) tabs.push('CULT');
          if (claims.techAdmin || claims.techCoordinator) tabs.push('TECH');
          
          setAvailableTabs(tabs);
          
          if (tabs.length > 0) {
            setSelectedTab(tabs[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching user claims:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserClaims();
  }, []);

  const hasAccess = () => {
    return availableTabs.length > 0;
  };

  const isAdminForTab = () => {
    if (!selectedTab) return false;
    if (selectedTab === 'SPORTS') return userClaims.sportsAdmin;
    if (selectedTab === 'CULT') return userClaims.cultAdmin;
    if (selectedTab === 'TECH') return userClaims.techAdmin;
    return false;
  };

  const isCoordinatorForTab = () => {
    if (!selectedTab) return false;
    if (selectedTab === 'SPORTS') return userClaims.sportsCoordinator;
    if (selectedTab === 'CULT') return userClaims.cultCoordinator;
    if (selectedTab === 'TECH') return userClaims.techCoordinator;
    return false;
  };

  const validateDate = (selectedDate: string, selectedMonth: string, selectedYear: string): { valid: boolean; error?: string } => {
    if (!selectedDate || !selectedMonth || !selectedYear) {
      return { valid: false, error: 'Please fill all date fields' };
    }

    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };

    const day = parseInt(selectedDate);
    const monthIndex = monthMap[selectedMonth];
    const yearNum = parseInt(selectedYear);

    const testDate = new Date(yearNum, monthIndex, day);
    
    if (testDate.getMonth() !== monthIndex || testDate.getDate() !== day) {
      const monthName = selectedMonth;
      const maxDays = new Date(yearNum, monthIndex + 1, 0).getDate();
      return { valid: false, error: `${monthName} only has ${maxDays} days` };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateTime = new Date(yearNum, monthIndex, day);
    selectedDateTime.setHours(0, 0, 0, 0);

    if (selectedDateTime < today) {
      return { valid: false, error: 'Cannot create event with a past date' };
    }

    return { valid: true };
  };

  const createTimestamp = (selectedDate: string, selectedMonth: string, selectedYear: string): number => {
    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };

    const eventDate = new Date(
      parseInt(selectedYear),
      monthMap[selectedMonth],
      parseInt(selectedDate)
    );
    
    return eventDate.getTime();
  };

  useEffect(() => {
    if (!hasAccess() || !selectedTab) return;

    const eventsRef = collection(db, 'events');
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const fetchedEvents: Event[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const eventTimestamp = data.timestamp || data.date;
        
        if (eventTimestamp < oneYearAgo) {
          deleteDoc(docSnap.ref);
        } else if (data.tab === selectedTab) {
          fetchedEvents.push({
            id: docSnap.id,
            title: data.title,
            description: data.description,
            date: data.date,
            month: data.month,
            year: data.year,
            timestamp: eventTimestamp,
            tab: data.tab,
          });
        }
      });

      setEvents(fetchedEvents.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => unsubscribe();
  }, [selectedTab, userClaims]);

  useEffect(() => {
    if (!isAdminForTab() || !selectedTab) return;

    const requestsRef = collection(db, 'eventRequests');
    const q = query(requestsRef, where('tab', '==', selectedTab));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests: EventRequest[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedRequests.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          date: data.date,
          month: data.month,
          year: data.year,
          timestamp: data.timestamp,
          tab: data.tab,
          requestedBy: data.requestedBy,
          requestedAt: data.requestedAt,
        });
      });

      setEventRequests(fetchedRequests.sort((a, b) => b.requestedAt - a.requestedAt));
    });

    return () => unsubscribe();
  }, [selectedTab, userClaims]);

  const handleAddEvent = async () => {
    if (!title || !description || !date || !month || !year) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const validation = validateDate(date, month, year);
    if (!validation.valid) {
      Alert.alert('Error', validation.error || 'Invalid date');
      return;
    }

    if (!selectedTab) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      const timestamp = createTimestamp(date, month, year);
      
      await addDoc(collection(db, 'events'), {
        title,
        description,
        date: parseInt(date),
        month,
        year: parseInt(year),
        timestamp,
        tab: selectedTab,
        createdAt: Date.now(),
      });

      Alert.alert('Success', 'Event added successfully');
      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add event');
      console.error(error);
    }
  };

  const handleRequestEvent = async () => {
    if (!title || !description || !date || !month || !year) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const validation = validateDate(date, month, year);
    if (!validation.valid) {
      Alert.alert('Error', validation.error || 'Invalid date');
      return;
    }

    if (!selectedTab) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      const user = auth.currentUser;
      const timestamp = createTimestamp(date, month, year);
      
      await addDoc(collection(db, 'eventRequests'), {
        title,
        description,
        date: parseInt(date),
        month,
        year: parseInt(year),
        timestamp,
        tab: selectedTab,
        requestedBy: user?.email || 'Unknown',
        requestedAt: Date.now(),
      });

      Alert.alert('Success', 'Event request submitted for approval');
      resetForm();
      setRequestModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request');
      console.error(error);
    }
  };

  const handleApproveRequest = async (request: EventRequest) => {
    try {
      await addDoc(collection(db, 'events'), {
        title: request.title,
        description: request.description,
        date: request.date,
        month: request.month,
        year: request.year,
        timestamp: request.timestamp,
        tab: request.tab,
        createdAt: Date.now(),
      });

      await deleteDoc(doc(db, 'eventRequests', request.id));

      Alert.alert('Success', 'Event approved and published');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request');
      console.error(error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'eventRequests', requestId));
      Alert.alert('Success', 'Event request rejected');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
      console.error(error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'events', eventId));
              Alert.alert('Success', 'Event deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setMonth('');
    setYear('');
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    options: string[],
    onSelect: (value: string) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <HapticPressable
        style={styles.pickerOverlay}
        onPress={onClose}
      >
        <View style={[styles.pickerModal, { backgroundColor: theme.background }]}>
          <Text style={[styles.pickerTitle, { color: theme.text }]}>{title}</Text>
          <ScrollView style={styles.pickerScroll}>
            {options.map((option) => (
              <HapticPressable
                key={option}
                style={[styles.pickerOption, { borderBottomColor: theme.inputBorder }]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={[styles.pickerOptionText, { color: theme.text }]}>{option}</Text>
              </HapticPressable>
            ))}
          </ScrollView>
        </View>
      </HapticPressable>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primaryText} />
      </View>
    );
  }

  if (!hasAccess()) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={64} color={theme.text} />
        <Text style={[styles.noAccessText, { color: theme.text }]}>
          You don't have access to this feature
        </Text>
        <Text style={[styles.noAccessSubtext, { color: theme.text }]}>
          Contact an administrator for access
        </Text>
      </View>
    );
  }

  return (
    <ServiceLayout
      icon={"file-tray-full-outline"}
      title={"Manage Events"}
      showTitle={true}
      showBottomImage={false}
      >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {availableTabs.length > 1 && (
          <View style={styles.tabContainer}>
            {availableTabs.map((tab) => (
              <HapticPressable
                key={tab}
                style={[
                  styles.tab,
                  selectedTab === tab && { backgroundColor: tab === 'SPORTS' ? '#4CAF50' : tab === 'CULT' ? '#E91E63' : '#2196F3'},
                  { borderColor: theme.inputBorder },
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Ionicons
                  name={
                    tab === 'SPORTS'
                      ? 'basketball'
                      : tab === 'CULT'
                      ? 'musical-notes'
                      : 'code-slash'
                  }
                  size={20}
                  color={selectedTab === tab ? '#fff' : theme.text}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: selectedTab === tab ? '#fff' : theme.text },
                  ]}
                >
                  {tab}
                </Text>
              </HapticPressable>
            ))}
          </View>
        )}
        {availableTabs.length === 1 && (
          <View style={styles.singleTabContainer}>
            <Text style={[styles.singleTabText, { color: theme.text }]}>
              Managing {availableTabs[0]} Events
            </Text>
          </View>
        )}
        <View style={styles.actionButtons}>
          {isAdminForTab() && (
            <HapticPressable
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add Event</Text>
            </HapticPressable>
          )}

          {isCoordinatorForTab() && (
            <HapticPressable
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => setRequestModalVisible(true)}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Request Event</Text>
            </HapticPressable>
          )}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {isAdminForTab() && eventRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Pending Requests ({eventRequests.length})
              </Text>
              {eventRequests.map((request) => (
                <View
                  key={request.id}
                  style={[styles.eventCard, { backgroundColor: theme.inputBackground }]}
                >
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: theme.text }]}>
                      {request.title}
                    </Text>
                    <Text style={[styles.requestBadge, { backgroundColor: '#FF9800' }]}>
                      Pending
                    </Text>
                  </View>
                  <Text style={[styles.eventDescription, { color: theme.text }]}>
                    {request.description}
                  </Text>
                  <View style={styles.eventMeta}>
                    <Text style={[styles.eventDate, { color: theme.text }]}>
                      <Ionicons name="calendar-outline" size={14} /> {request.date} {request.month} {request.year}
                    </Text>
                    <Text style={[styles.requestedBy, { color: theme.text }]}>
                      By: {request.requestedBy}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <HapticPressable
                      style={[styles.approveButton, { backgroundColor: 'green' }]}
                      onPress={() => handleApproveRequest(request)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </HapticPressable>
                    <HapticPressable
                      style={[styles.rejectButton, { backgroundColor: 'red' }]}
                      onPress={() => handleRejectRequest(request.id)}
                    >
                      <Ionicons name="close-circle" size={16} color="#fff" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </HapticPressable>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Published Events ({events.length})
            </Text>
            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={theme.text} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  No events published yet
                </Text>
              </View>
            ) : (
              events.map((event) => (
                <View
                  key={event.id}
                  style={[styles.eventCard, { backgroundColor: theme.inputBackground }]}
                >
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: theme.text }]}>
                      {event.title}
                    </Text>
                    {isAdminForTab() && (
                      <HapticPressable onPress={() => handleDeleteEvent(event.id)}>
                        <Ionicons name="trash-outline" size={20} color={'red'} />
                      </HapticPressable>
                    )}
                  </View>
                  <Text style={[styles.eventDescription, { color: theme.text }]}>
                    {event.description}
                  </Text>
                  <Text style={[styles.eventDate, { color: theme.text }]}>
                    <Ionicons name="calendar-outline" size={14} /> {event.date} {event.month} {event.year}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Event</Text>
                <HapticPressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </HapticPressable>
              </View>

              <ScrollView>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="Event Title"
                  placeholderTextColor={theme.placeholder}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="Event Description"
                  placeholderTextColor={theme.placeholder}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
                <HapticPressable
                  style={[styles.input, { backgroundColor: theme.inputBackground, justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.pickerText, { color: date ? theme.text : theme.placeholder }]}>
                    {date || 'Select Date'}
                  </Text>
                </HapticPressable>
                <HapticPressable
                  style={[styles.input, { backgroundColor: theme.inputBackground, justifyContent: 'center' }]}
                  onPress={() => setShowMonthPicker(true)}
                >
                  <Text style={[styles.pickerText, { color: month ? theme.text : theme.placeholder }]}>
                    {month || 'Select Month'}
                  </Text>
                </HapticPressable>
                <HapticPressable
                  style={[styles.input, { backgroundColor: theme.inputBackground, justifyContent: 'center' }]}
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={[styles.pickerText, { color: year ? theme.text : theme.placeholder }]}>
                    {year || 'Select Year'}
                  </Text>
                </HapticPressable>

                <HapticPressable
                  style={[styles.submitButton, { backgroundColor: theme.primaryText }]}
                  onPress={handleAddEvent}
                >
                  <Text style={[styles.submitButtonText, {color: theme.background}]}>Add Event</Text>
                </HapticPressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
        <Modal
          visible={requestModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setRequestModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Request Event</Text>
                <HapticPressable onPress={() => setRequestModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </HapticPressable>
              </View>

              <ScrollView>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="Event Title"
                  placeholderTextColor={theme.placeholder}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text }]}
                  placeholder="Event Description"
                  placeholderTextColor={theme.placeholder}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
                <HapticPressable
                  style={[styles.input, { backgroundColor: theme.inputBackground, justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.pickerText, { color: date ? theme.text : theme.placeholder }]}>
                    {date || 'Select Date'}
                  </Text>
                </HapticPressable>
                <HapticPressable
                  style={[styles.input, { backgroundColor: theme.inputBackground, justifyContent: 'center' }]}
                  onPress={() => setShowMonthPicker(true)}
                >
                  <Text style={[styles.pickerText, { color: month ? theme.text : theme.placeholder }]}>
                    {month || 'Select Month'}
                  </Text>
                </HapticPressable>
                <HapticPressable
                  style={[styles.input, { backgroundColor: theme.inputBackground, justifyContent: 'center' }]}
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={[styles.pickerText, { color: year ? theme.text : theme.placeholder }]}>
                    {year || 'Select Year'}
                  </Text>
                </HapticPressable>

                <HapticPressable
                  style={[styles.submitButton, { backgroundColor: theme.text }]}
                  onPress={handleRequestEvent}
                >
                  <Text style={[styles.submitButtonText, {color: theme.background}]}>Submit Request</Text>
                </HapticPressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
        {renderPickerModal(
          showDatePicker,
          () => setShowDatePicker(false),
          DAYS,
          setDate,
          'Select Date'
        )}
        {renderPickerModal(
          showMonthPicker,
          () => setShowMonthPicker(false),
          MONTHS,
          setMonth,
          'Select Month'
        )}
        {renderPickerModal(
          showYearPicker,
          () => setShowYearPicker(false),
          YEARS,
          setYear,
          'Select Year'
        )}
      </View>
    </View>
    </ServiceLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noAccessSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  singleTabContainer: {
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  singleTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDate: {
    fontSize: 12,
  },
  requestedBy: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  requestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    gap: 4,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    gap: 4,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerText: {
    fontSize: 14,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});