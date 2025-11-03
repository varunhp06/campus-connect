import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function HapticPressable({ onPress, ...props }: PressableProps) {
  const handlePress = (event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.(event);
  };

  return <Pressable {...props} onPress={handlePress} />;
}
