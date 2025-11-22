import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

interface ServiceLayoutProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title?: string;
  children?: React.ReactNode;
  bottomImage?: ImageSourcePropType;
  bottomImageStyle?: object;
  showTitle?: boolean;
  showBottomImage?: boolean;
}

export const ServiceLayout: React.FC<ServiceLayoutProps> = ({
  icon,
  title,
  children,
  bottomImage,
  bottomImageStyle,
  showTitle = true,
  showBottomImage = true,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {showTitle && title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {icon && <Ionicons name={icon} color={theme.text} size={20} />} {title}
          </Text>
        </View>
      )}

      <View style={styles.childrenContainer}>{children}</View>

      {showBottomImage && bottomImage && (
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
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  childrenContainer: {
    flex: 1,
  },
  bottomImageContainer: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    width: '100%',
    height: 300,
    zIndex: 2,
    pointerEvents: 'none',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
});