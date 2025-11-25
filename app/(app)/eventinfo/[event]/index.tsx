import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router"; 
import { ThemedLayout } from "@/components/ThemedLayout";
import { fetchActivities } from "@/components/data/activities"; 
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get('window');

// --- Types ---
export interface ActivityItemInterface {
  id: string | number;
  title: string;
  description: string;
  date: string | number;
  month: string;
  year: number;
  timestamp: number;
  tab: "SPORTS" | "CULT" | "TECH";
  poster?: string;
  venue?: string;
  keyPoints?: string[];
  createdAt?: number;
}

const EventDetailPage: React.FC = () => {
  const { event: eventId } = useLocalSearchParams(); 
  const router = useRouter();
  
  const [item, setItem] = useState<ActivityItemInterface | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Helper: Get Color based on Tab ---
  const getCategoryColor = (tab: string) => {
    switch (tab) {
      case 'TECH': return '#3B82F6'; // Blue
      case 'CULT': return '#EC4899'; // Pink
      case 'SPORTS': return '#10B981'; // Emerald
      default: return '#F59E0B'; // Amber
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return;
      try {
        const allActivities = await fetchActivities();
        const found = allActivities.find((a) => a.id.toString() === eventId.toString());
        setItem(found as ActivityItemInterface || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventId]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#fff' }]}>
         <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!item) {
    return (
      <ThemedLayout>
         <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
            <Text style={styles.errorText}>Event not found</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonSimple}>
                <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
         </View>
      </ThemedLayout>
    );
  }

  const accentColor = getCategoryColor(item.tab);
  // Fallback image if no poster provided
  const displayImage = item.poster 
    ? { uri: item.poster  } 
    : { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop' };

  return (
    <View style={styles.mainContainer}>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }} // Space for footer
        bounces={false}
      >
        {/* --- 1. HERO SECTION --- */}
        <View style={styles.heroContainer}>
          <Image source={displayImage} style={styles.heroImage} resizeMode="cover" />
          
          {/* Gradient for text readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
            style={styles.gradientOverlay}
          />

          {/* Top Header Buttons */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn}>
              <Ionicons name="share-social-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Title on Image */}
          <View style={styles.heroContent}>
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
                <Text style={styles.badgeText}>{item.tab}</Text>
            </View>
            <Text style={styles.heroTitle}>{item.title}</Text>
          </View>
        </View>

        {/* --- 2. DETAILS SHEET --- */}
        <View style={styles.sheetContainer}>
          
          {/* Meta Data Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{item.date} {item.month} {item.year}</Text>
                </View>
            </View>

            {item.venue && (
                <View style={styles.metaItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="location" size={20} color="#10B981" />
                    </View>
                    <View>
                        <Text style={styles.metaLabel}>Venue</Text>
                        <Text style={styles.metaValue} numberOfLines={1}>{item.venue}</Text>
                    </View>
                </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.descriptionText}>{item.description}</Text>
          </View>

          {/* Key Points */}
          {item.keyPoints && item.keyPoints.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              <View style={styles.pointsContainer}>
                {item.keyPoints.map((p, index) => (
                    <View key={index} style={styles.pointRow}>
                        <Ionicons name="checkmark-circle" size={18} color={accentColor} style={{ marginTop: 2 }} />
                        <Text style={styles.pointText}>{p}</Text>
                    </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* --- 3. STICKY FOOTER --- */}
      <View style={styles.footer}>
         <View>
            <Text style={styles.footerPriceLabel}>Status</Text>
            <Text style={[styles.footerPriceValue, { color: accentColor }]}>Open</Text>
         </View>
         <TouchableOpacity style={[styles.registerBtn, { backgroundColor: accentColor }]}>
            <Text style={styles.registerBtnText}>Register Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
         </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    color: '#374151'
  },
  backButtonSimple: {
    marginTop: 15,
    padding: 10,
  },
  backButtonText: {
    color: '#3B82F6',
    fontWeight: '600'
  },

  // HERO
  heroContainer: {
    height: height * 0.45,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0, 
    right: 0, 
    bottom: 0, 
    height: '100%',
  },
  headerBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // SHEET
  sheetContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '700',
  },
  
  // CONTENT
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  pointsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  pointRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  pointText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },

  // FOOTER
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footerPriceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  registerBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  }
});

export default EventDetailPage;