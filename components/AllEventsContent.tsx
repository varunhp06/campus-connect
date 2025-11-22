import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from './HapticPressable';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { fetchActivities, ActivityItem } from './data/activities';

export const AllEventsContent: React.FC = () => {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] =
    useState<'SPORTS' | 'CULT' | 'TECH' | 'ALL'>('SPORTS');
  const [showUpcoming, setShowUpcoming] = useState(true);
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabColors: Record<string, string> = {
    SPORTS: '#4CAF50',
    CULT: '#E91E63',
    TECH: '#2196F3',
    ALL: '#FF9800',
  };

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedActivities = await fetchActivities();
        setActivities(fetchedActivities);
      } catch (err) {
        setError('Failed to load activities');
        console.error('Error loading activities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, []);

  const isEventPassed = (date: string, month: string, year: number): boolean => {
    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };
    const eventDate = new Date(year, monthMap[month], parseInt(date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  const sortedActivities = useMemo(() => {
    const monthMap: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };
    return [...activities].sort((a, b) => {
      const dateA = new Date(a.year, monthMap[a.month], parseInt(a.date));
      const dateB = new Date(b.year, monthMap[b.month], parseInt(b.date));
      return dateA.getTime() - dateB.getTime();
    });
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let filtered = sortedActivities;
    if (showUpcoming)
      filtered = filtered.filter((a) => !isEventPassed(a.date, a.month, a.year));
    if (selectedTab !== 'ALL')
      filtered = filtered.filter((a) => a.tab === selectedTab);
    return filtered;
  }, [sortedActivities, selectedTab, showUpcoming]);

  const generatePDF = async () => {
    if (activities.length === 0) {
      Alert.alert('No Events', 'There are no events to export.');
      return;
    }

    try {
      const eventsHTML = sortedActivities
        .map((a) => {
          const isPassed = isEventPassed(a.date, a.month, a.year);
          return `
            <tr style="${isPassed ? 'opacity:0.5;text-decoration:line-through;' : ''}">
              <td style="padding:8px;border:1px solid #ccc;">${a.date} ${a.month} ${a.year}</td>
              <td style="padding:8px;border:1px solid #ccc;">
                <span style="background:${tabColors[a.tab]};color:white;padding:2px 6px;border-radius:4px;">${a.tab}</span>
              </td>
              <td style="padding:8px;border:1px solid #ccc;font-weight:bold;">${a.title}</td>
              <td style="padding:8px;border:1px solid #ccc;">${a.description}</td>
              <td style="padding:8px;text-align:center;border:1px solid #ccc;">${isPassed ? '✓' : '—'}</td>
            </tr>
          `;
        })
        .join('');

      const html = `
        <html>
          <body style="font-family:Arial;padding:24px;color:#333;">
            <h1 style="color:#2196F3;">Campus Events Calendar</h1>
            <p style="color:#666;font-size:14px;margin-bottom:24px;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f3f3f3;">
                  <th>Date</th><th>Category</th><th>Title</th><th>Description</th><th>Status</th>
                </tr>
              </thead>
              <tbody>${eventsHTML}</tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const pdfName = `Campus_Events_${new Date().getFullYear()}.pdf`;

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            pdfName,
            'application/pdf'
          ).then(async (fileUri) => {
            await FileSystem.writeAsStringAsync(fileUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert('Downloaded', 'PDF saved to Downloads folder!');
          });
        } else {
          Alert.alert('Permission Denied', 'Cannot save file without permission.');
        }
      } else {
        const pdfPath = `${FileSystem.documentDirectory}${pdfName}`;
        await FileSystem.moveAsync({ from: uri, to: pdfPath });
        Alert.alert('Saved', `PDF saved to: ${pdfPath}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const retryLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedActivities = await fetchActivities();
      setActivities(fetchedActivities);
    } catch (err) {
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={{ color: theme.placeholder, marginTop: 12 }}>
            Loading events...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.placeholder} />
          <Text style={[styles.errorText, { color: theme.placeholder }]}>
            {error}
          </Text>
          <HapticPressable
            style={({ pressed }) => [
              styles.retryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={retryLoad}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </HapticPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with PDF Button */}
      <View style={styles.headerSection}>
        <HapticPressable
          style={({ pressed }) => [
            styles.pdfButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={generatePDF}
        >
          <Ionicons name="download-outline" size={20} color="#FF9800" />
          <Text style={styles.pdfButtonText}>Download PDF</Text>
        </HapticPressable>
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <View
          style={[
            styles.toggle,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <HapticPressable
            style={({ pressed }) => [
              styles.toggleButton,
              showUpcoming && styles.toggleButtonActive,
              showUpcoming && { backgroundColor: '#FF9800' },
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setShowUpcoming(true)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: showUpcoming ? '#fff' : theme.placeholder },
              ]}
            >
              Upcoming
            </Text>
          </HapticPressable>
          <HapticPressable
            style={({ pressed }) => [
              styles.toggleButton,
              !showUpcoming && styles.toggleButtonActive,
              !showUpcoming && { backgroundColor: '#FF9800' },
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setShowUpcoming(false)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: !showUpcoming ? '#fff' : theme.placeholder },
              ]}
            >
              All Events
            </Text>
          </HapticPressable>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
          },
        ]}
      >
        {['SPORTS', 'CULT', 'TECH', 'ALL'].map((tab) => (
          <HapticPressable
            key={tab}
            style={({ pressed }) => [
              styles.tab,
              selectedTab === tab && {
                borderBottomWidth: 2,
                borderBottomColor: tabColors[tab],
              },
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setSelectedTab(tab as typeof selectedTab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === tab ? tabColors[tab] : theme.placeholder },
              ]}
            >
              {tab}
            </Text>
          </HapticPressable>
        ))}
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.placeholder} />
            <Text style={[styles.emptyText, { color: theme.placeholder }]}>
              No {showUpcoming ? 'upcoming ' : ''}{selectedTab.toLowerCase()} events found
            </Text>
          </View>
        ) : (
          filteredActivities.map((item) => {
            const isPassed = isEventPassed(item.date, item.month, item.year);
            return (
              <HapticPressable
                key={item.id}
                style={({ pressed }) => [
                  styles.activityItem,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    opacity: isPassed ? 0.5 : pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dateBox,
                    {
                      backgroundColor: isPassed
                        ? '#999'
                        : tabColors[item.tab] || '#5C9FD6',
                    },
                  ]}
                >
                  <Text style={styles.dateNumber}>{item.date}</Text>
                  <Text style={styles.dateMonth}>{item.month}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text
                    style={[
                      styles.activityTitle,
                      { color: theme.text },
                      isPassed && styles.strikethrough,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.activityDescription,
                      { color: theme.placeholder },
                      isPassed && styles.strikethrough,
                    ]}
                  >
                    {item.description}
                  </Text>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: tabColors[item.tab] },
                    ]}
                  >
                    <Text style={styles.categoryText}>{item.tab}</Text>
                  </View>
                </View>
              </HapticPressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, alignItems: 'flex-end' },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  pdfButtonText: { color: '#FF9800', fontSize: 14, fontWeight: '600' },
  toggleContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  toggle: { flexDirection: 'row', borderRadius: 12, borderWidth: 0.7, overflow: 'hidden', padding: 4 },
  toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '600' },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 0.7,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.7,
    marginBottom: 12,
    position: 'relative',
  },
  dateBox: {
    width: 60,
    height: 70,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  dateMonth: { fontSize: 10, fontWeight: '600', color: '#fff', marginTop: 2 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  activityDescription: { fontSize: 13, marginBottom: 8 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  categoryText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  strikethrough: { textDecorationLine: 'line-through' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
});