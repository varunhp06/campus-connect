// components/MemberList.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AdministrationMember } from '@/components/data/administration';
import { useTheme } from '@/components/ThemeContext';
import { router } from 'expo-router';

interface MemberListProps {
  members: AdministrationMember[];
}

export const MemberList: React.FC<MemberListProps> = ({ members }) => {
  const { theme } = useTheme();

  const handleMemberPress = (member: AdministrationMember) => {
    router.push({
      pathname: '/(app)/campus-services/administration/profile',
      params: { member: JSON.stringify(member) }
    });
  };

  const renderMember = ({ item }: { item: AdministrationMember }) => (
    <TouchableOpacity
      style={[styles.memberCard, { backgroundColor: theme.inputBackground }]}
      onPress={() => handleMemberPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.memberImage}
        resizeMode="cover"
      />
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.department && (
          <Text style={[styles.memberDepartment, { color: theme.text }]} numberOfLines={1}>
            {item.department}
          </Text>
        )}
        {item.description && (
          <Text style={[styles.memberDescription, { color: theme.text }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={members}
      renderItem={renderMember}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberDepartment: {
    fontSize: 14,
    marginBottom: 4,
  },
  memberDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});