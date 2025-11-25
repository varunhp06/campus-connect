// types/lostAndFound.ts

export interface LostItem {
  id: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  itemName: string;
  description: string;
  lastKnownLocation: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  dateLost: Date;
  timeLost: string;
  createdAt: Date;
  status: 'active' | 'found' | 'removed';
}

export interface FoundItem {
  id: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  itemName: string;
  description: string;
  foundLocation: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  dateFound: Date;
  timeFound: string;
  createdAt: Date;
  status: 'active' | 'claimed' | 'removed';
}

export interface LostAndFoundLog {
  id: string;
  type: 'lost' | 'found';
  itemName: string;
  description: string;
  location: string;
  imageUrl: string;
  posterUserId: string;
  posterEmail: string;
  posterPhone: string;
  claimerUserId: string;
  claimerEmail: string;
  claimerPhone: string;
  dateTime: Date;
  resolvedAt: Date;
  itemId: string;
}

export interface CreateLostItemData {
  itemName: string;
  description: string;
  lastKnownLocation: string;
  imageUri: string;
  dateLost: Date;
  timeLost: string;
}

export interface CreateFoundItemData {
  itemName: string;
  description: string;
  foundLocation: string;
  imageUri: string;
  dateFound: Date;
  timeFound: string;
}