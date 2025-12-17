import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router'; 
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable from './HapticPressable';
import * as Print from 'expo-print'; 
import * as FileSystem from 'expo-file-system/legacy'; 
import { fetchActivities, ActivityItem } from './data/activities';
import { ServiceLayout } from './ServiceLayout';
import CustomAlert from './CustomAlert'; 

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AllEventsContent: React.FC = () => {
  const router = useRouter(); 
  const { theme, isDarkMode } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'SPORTS' | 'CULT' | 'TECH' | 'ALL'>('SPORTS');
  const [showUpcoming, setShowUpcoming] = useState(true);
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listOpacity = useRef(new Animated.Value(1)).current;

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Okay',
    cancelText: 'Cancel',
    onConfirm: () => {},
    confirmButtonColor: '#007AFF'
  });

  const showAlert = (title: string, message: string, isError = false) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      confirmText: 'Okay',
      cancelText: 'Close',
      confirmButtonColor: isError ? '#ef4444' : '#007AFF',
      onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
    });
  };

  const tabColors: Record<string, string> = {
    SPORTS: '#10B981', 
    CULT: '#F43F5E',   
    TECH: '#3B82F6',   
    ALL: '#F59E0B',    
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

  const handleTabChange = (tab: typeof selectedTab) => {
    if (selectedTab === tab) return;

    LayoutAnimation.configureNext({
        duration: 300,
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });

    setSelectedTab(tab);
  };

  const handleToggleUpcoming = (status: boolean) => {
      if (showUpcoming === status) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowUpcoming(status);
  };

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
      showAlert('No Events', 'There are no events to export.', true);
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
            showAlert('Downloaded', 'PDF saved to Downloads folder!');
          });
        } else {
          showAlert('Permission Denied', 'Cannot save file without permission.', true);
        }
      } else {
        const pdfPath = `${FileSystem.documentDirectory}${pdfName}`;
        await FileSystem.moveAsync({ from: uri, to: pdfPath });
        showAlert('Saved', `PDF saved to: ${pdfPath}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlert('Error', 'Failed to generate PDF.', true);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={tabColors.ALL} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.placeholder} />
        <Text style={[styles.errorText, { color: theme.text }]}>Oops! {error}</Text>
        <HapticPressable style={styles.retryBtn} onPress={() => window.location.reload()}>
             <Text style={styles.retryText}>Try Again</Text>
        </HapticPressable>
      </View>
    );
  }

  const activePillColor = isDarkMode ? '#fff' : '#000';
  const inactivePillBg = isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0';
  const cardBg = isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0';

  return (
    <ServiceLayout
      icon="calendar"
      title="Events"
      showTitle={true}
      showBottomImage={false}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        
        <CustomAlert 
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          confirmButtonColor={alertConfig.confirmButtonColor}
        />

        <View style={styles.controlRow}>
            <View style={[styles.togglePill, { backgroundColor: inactivePillBg }]}>
                <HapticPressable 
                    style={[styles.toggleOption, showUpcoming && styles.activeToggle]}
                    onPress={() => handleToggleUpcoming(true)}
                >
                    <Text style={[
                        styles.toggleText, 
                        { color: showUpcoming ? activePillColor : theme.placeholder }
                    ]}>Upcoming</Text>
                </HapticPressable>
                <HapticPressable 
                    style={[styles.toggleOption, !showUpcoming && styles.activeToggle]}
                    onPress={() => handleToggleUpcoming(false)}
                >
                    <Text style={[
                        styles.toggleText, 
                        { color: !showUpcoming ? activePillColor : theme.placeholder }
                    ]}>All</Text>
                </HapticPressable>
            </View>

            <HapticPressable 
                style={[styles.pdfBtn, { backgroundColor: inactivePillBg }]} 
                onPress={generatePDF}
            >
                <Ionicons name="download-outline" size={18} color={theme.text} />
            </HapticPressable>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {['SPORTS', 'CULT', 'TECH', 'ALL'].map((tab) => {
                    const isActive = selectedTab === tab;
                    const badgeColor = tabColors[tab];
                    
                    return (
                        <HapticPressable
                            key={tab}
                            style={[
                                styles.pill,
                                { 
                                    backgroundColor: isActive ? badgeColor : 'transparent',
                                    borderColor: isActive ? badgeColor : theme.inputBorder,
                                    borderWidth: 1,
                                    transform: [{ scale: isActive ? 1.05 : 1 }]
                                }
                            ]}
                            onPress={() => handleTabChange(tab as any)}
                        >
                            <Text style={[
                                styles.pillText,
                                { color: isActive ? '#fff' : theme.placeholder }
                            ]}>
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </Text>
                        </HapticPressable>
                    );
                })}
            </ScrollView>
        </View>

        <Animated.ScrollView 
            style={[styles.scrollView, { opacity: listOpacity }]} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBg, { backgroundColor: inactivePillBg }]}>
                    <Ionicons name="calendar-clear-outline" size={32} color={theme.placeholder} />
                </View>
                <Text style={[styles.emptyText, { color: theme.placeholder }]}>
                    No events found
                </Text>
            </View>
          ) : (
            filteredActivities.map((item) => {
              const isPassed = isEventPassed(item.date, item.month, item.year);
              const accentColor = tabColors[item.tab];

              return (
                <HapticPressable
                  key={item.id}
                  onPress={() => {
                    router.push(`/(app)/eventinfo/${item.id}`); 
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    { 
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                        opacity: isPassed ? 0.6 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                    }
                  ]}
                >
                  <View style={styles.dateColumn}>
                    <Text style={[styles.dateText, { color: theme.text }]}>{item.date}</Text>
                    <Text style={[styles.monthText, { color: accentColor }]}>{item.month}</Text>
                  </View>

                  <View style={[styles.divider, { backgroundColor: cardBorder }]} />

                  <View style={styles.contentColumn}>
                    <View style={styles.cardHeader}>
                        <Text style={[
                            styles.cardTitle, 
                            { color: theme.text, textDecorationLine: isPassed ? 'line-through' : 'none' }
                        ]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {isPassed && (
                            <View style={styles.passedBadge}>
                                <Text style={styles.passedText}>Ended</Text>
                            </View>
                        )}
                    </View>
                    
                    <Text style={[styles.cardDesc, { color: theme.placeholder }]} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={[styles.miniBadge, { backgroundColor: `${accentColor}20` }]}>
                            <View style={[styles.dot, { backgroundColor: accentColor }]} />
                            <Text style={[styles.miniBadgeText, { color: accentColor }]}>{item.tab}</Text>
                        </View>
                    </View>
                  </View>
                </HapticPressable>
              );
            })
          )}
        </Animated.ScrollView>
      </View>
    </ServiceLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 16, fontSize: 16, fontWeight: '500' },
  retryBtn: { marginTop: 12, padding: 10 },
  retryText: { color: '#3B82F6', fontWeight: '600' },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  togglePill: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    width: 200,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeToggle: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: { fontSize: 13, fontWeight: '600' },
  pdfBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: { marginTop: 16, paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  scrollView: { flex: 1, marginTop: 4 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  dateColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  dateText: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  monthText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  divider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
    marginHorizontal: 16,
  },
  contentColumn: { flex: 1, justifyContent: 'center' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  passedBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  passedText: { fontSize: 10, fontWeight: '600', color: '#888' },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row' },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  miniBadgeText: { fontSize: 11, fontWeight: '600' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 15, fontWeight: '500' },
});