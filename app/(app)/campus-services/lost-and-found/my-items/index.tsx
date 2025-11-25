// screens/MyItems.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { ServiceLayout } from '@/components/ServiceLayout';
import { ThemedLayout } from '@/components/ThemedLayout';
import { useTheme } from '@/components/ThemeContext';
import HapticPressable from '@/components/HapticPressable';

interface LostAndFoundLog {
  id: string;
  itemName: string;
  description: string;
  posterEmail: string;
  posterPhone: string;
  claimerEmail: string;
  claimerPhone: string;
  imageUrl: string;
  timestamp: Date;
}

export default function MyItemsScreen() {
  const { theme, isDarkMode } = useTheme();
  const [logs, setLogs] = useState<LostAndFoundLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LostAndFoundLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setLoading(false);
      return;
    }

    const logsRef = collection(db, 'lostAndFoundLogs');
    const q = query(
      logsRef,
      or(
        where('posterEmail', '==', currentUser.email),
        where('claimerEmail', '==', currentUser.email)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: LostAndFoundLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedLogs.push({
          id: doc.id,
          itemName: data.itemName || '',
          description: data.description || '',
          posterEmail: data.posterEmail || '',
          posterPhone: data.posterPhone || '',
          claimerEmail: data.claimerEmail || '',
          claimerPhone: data.claimerPhone || '',
          imageUrl: data.imageUrl || '',
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });

      // Sort by timestamp, most recent first
      fetchedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setLogs(fetchedLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const isUserPoster = (log: LostAndFoundLog) => {
    return log.posterEmail === currentUser?.email;
  };

  const renderItem = ({ item }: { item: LostAndFoundLog }) => {
    const isPoster = isUserPoster(item);
    const contactEmail = isPoster ? item.claimerEmail : item.posterEmail;
    const role = isPoster ? 'Posted by you' : 'Claimed by you';

    return (
      <HapticPressable
        style={[styles.card, { backgroundColor: theme.inputBackground }]}
        onPress={() => {
          setSelectedLog(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardContent}>
            <Text style={[styles.itemName, { color: theme.primaryText }]}>
              {item.itemName}
            </Text>
            <Text style={[styles.role, { color: theme.placeholder }]}>
              {role}
            </Text>
            <Text
              style={[styles.description, { color: theme.text }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            <Text style={[styles.contact, { color: theme.placeholder }]}>
              Contact: {contactEmail}
            </Text>
            <Text style={[styles.date, { color: theme.placeholder }]}>
              {item.timestamp.toLocaleDateString()} at{' '}
              {item.timestamp.toLocaleTimeString()}
            </Text>
          </View>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          )}
        </View>
      </HapticPressable>
    );
  };

  if (loading) {
    return (
      <ThemedLayout
        showNavbar={true}
        navbarConfig={{
          showHamburger: true,
          showTitle: true,
          showThemeToggle: true,
        }}
      >
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      </ThemedLayout>
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
        icon={"list"}
        title={"My Items"}
        showTitle={true}
        showBottomImage={false}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                No items found. Post or claim items to see them here.
              </Text>
            }
          />

          {/* Detail Modal */}
          <Modal
            visible={detailModalVisible}
            animationType="slide"
            onRequestClose={() => setDetailModalVisible(false)}
          >
            {selectedLog && (
              <ScrollView
                style={[
                  styles.detailContainer,
                  { backgroundColor: theme.background },
                ]}
              >
                {selectedLog.imageUrl && (
                  <Image
                    source={{ uri: selectedLog.imageUrl }}
                    style={styles.detailImage}
                  />
                )}

                <Text style={[styles.detailTitle, { color: theme.primaryText }]}>
                  {selectedLog.itemName}
                </Text>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {isUserPoster(selectedLog) ? 'You Posted' : 'You Claimed'}
                  </Text>
                </View>

                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>
                  Description:
                </Text>
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {selectedLog.description}
                </Text>

                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>
                  {isUserPoster(selectedLog) ? 'Claimer Contact:' : 'Poster Contact:'}
                </Text>
                <Text style={[styles.detailText, { color: theme.text }]}>
                  Email:{' '}
                  {isUserPoster(selectedLog)
                    ? selectedLog.claimerEmail
                    : selectedLog.posterEmail}
                </Text>
                <Text style={[styles.detailText, { color: theme.text }]}>
                  Phone:{' '}
                  {isUserPoster(selectedLog)
                    ? selectedLog.claimerPhone || 'Not provided'
                    : selectedLog.posterPhone || 'Not provided'}
                </Text>

                <Text style={[styles.detailLabel, { color: theme.placeholder }]}>
                  Date:
                </Text>
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {selectedLog.timestamp.toLocaleDateString()} at{' '}
                  {selectedLog.timestamp.toLocaleTimeString()}
                </Text>

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
  role: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  contact: {
    fontSize: 13,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
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
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  badge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 24,
    marginHorizontal: 24,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 24,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  closeButton: {
    marginTop: 32,
    marginHorizontal: 24,
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