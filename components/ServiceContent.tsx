import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
  FlatList,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ServiceButton {
  id: string;
  title: string;
  description: string;
  color: string;
  route: string;
  status?: string; 
}

interface ServiceContentProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  buttons: ServiceButton[];
  bottomImage?: ImageSourcePropType;
  bottomImageStyle?: object;
}

export const ServiceContent: React.FC<ServiceContentProps> = ({
  icon,
  title,
  buttons,
  bottomImage,
  bottomImageStyle,
}) => {
  const { theme } = useTheme();

  const renderButton = ({ item }: { item: ServiceButton }) => {
    const isOffline = item.status?.toLowerCase() === 'offline';
    const isOnline = item.status?.toLowerCase() === 'online';
    const isPressable = !isOffline; 

    return (
      <Pressable
        disabled={!isPressable}
        onPress={() => {
          if (isPressable) console.log('Navigate to', item.route);
        }}
        style={({ pressed }) => [
          styles.utilityCard,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
            opacity: pressed ? 0.7 : isOffline ? 0.4 : 1, 
          },
        ]}
      >
        <View
          style={[styles.utilityBorder, { backgroundColor: item.color }]}
        />
        <View style={styles.utilityContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.utilityTitle, { color: theme.text }]}>
              {item.title}
            </Text>
            {item.status && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isOnline ? '#4CAF50' : '#F44336',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[styles.utilityDescription, { color: theme.placeholder }]}
          >
            {item.description}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          <Ionicons name={icon} color={theme.text} size={20} /> {title}
        </Text>
      </View>

      <FlatList
        data={buttons}
        renderItem={renderButton}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      />

      {bottomImage && (
        <View style={styles.bottomImageContainer}>
          <Image
            source={bottomImage}
            style={[styles.bottomImage, bottomImageStyle]}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    marginTop: 35,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  bottomImageContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    zIndex: 2,
  },
  bottomImage: {
    width: '100%',
    height: '130%',
    position: 'absolute',
  },
  utilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.7,
    padding: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  utilityBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
  },
  utilityContent: {
    flex: 1,
    marginLeft: 5,
  },
  utilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  utilityDescription: {
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
