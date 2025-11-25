// services/lostAndFoundService.ts
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import {
  LostItem,
  FoundItem,
  LostAndFoundLog,
  CreateLostItemData,
  CreateFoundItemData,
} from '@/components/data/lostAndFound';
import { uploadToCloudinary, deleteFromCloudinary } from '@/components/data/cloudinaryUtils';
import { notifyAllUsers, notifySpecificUser } from '@/components/data/notificationUtils';
import Constants from 'expo-constants';

const CLOUDINARY_CLOUD_NAME = Constants.expoConfig?.extra?.cloudinaryCloudName;
const CLOUDINARY_UPLOAD_PRESET = Constants.expoConfig?.extra?.cloudinaryUploadPreset;

export const createLostItem = async (
  data: CreateLostItemData,
  userId: string,
  userEmail: string,
  userPhone: string
): Promise<string> => {
  try {
    // Upload image to Cloudinary
    const { url, publicId } = await uploadToCloudinary(
      data.imageUri,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET
    );

    // Create lost item document
    const lostItemData = {
      userId,
      userEmail,
      userPhone,
      itemName: data.itemName,
      description: data.description,
      lastKnownLocation: data.lastKnownLocation,
      imageUrl: url,
      cloudinaryPublicId: publicId,
      dateLost: Timestamp.fromDate(data.dateLost),
      timeLost: data.timeLost,
      createdAt: Timestamp.now(),
      status: 'active',
    };

    const docRef = await addDoc(collection(db, 'lostItems'), lostItemData);

    // Notify all other users
    await notifyAllUsers(
      userId,
      'Item Lost',
      `Someone lost ${data.itemName} at ${data.lastKnownLocation}`,
      { type: 'lost', itemId: docRef.id }
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating lost item:', error);
    throw error;
  }
};

export const createFoundItem = async (
  data: CreateFoundItemData,
  userId: string,
  userEmail: string,
  userPhone: string
): Promise<string> => {
  try {
    // Upload image to Cloudinary
    const { url, publicId } = await uploadToCloudinary(
      data.imageUri,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET
    );

    // Create found item document
    const foundItemData = {
      userId,
      userEmail,
      userPhone,
      itemName: data.itemName,
      description: data.description,
      foundLocation: data.foundLocation,
      imageUrl: url,
      cloudinaryPublicId: publicId,
      dateFound: Timestamp.fromDate(data.dateFound),
      timeFound: data.timeFound,
      createdAt: Timestamp.now(),
      status: 'active',
    };

    const docRef = await addDoc(collection(db, 'foundItems'), foundItemData);

    // Notify all other users
    await notifyAllUsers(
      userId,
      'Item Found',
      `Someone found ${data.itemName} at ${data.foundLocation}`,
      { type: 'found', itemId: docRef.id }
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating found item:', error);
    throw error;
  }
};

export const claimFoundLostItem = async (
  itemId: string,
  claimerUserId: string,
  claimerEmail: string,
  claimerPhone: string,
  item: LostItem
): Promise<void> => {
  try {
    // Create log entry
    const logData: Omit<LostAndFoundLog, 'id'> = {
      type: 'lost',
      itemName: item.itemName,
      description: item.description,
      location: item.lastKnownLocation,
      imageUrl: item.imageUrl,
      posterUserId: item.userId,
      posterEmail: item.userEmail,
      posterPhone: item.userPhone,
      claimerUserId,
      claimerEmail,
      claimerPhone,
      dateTime: item.dateLost,
      resolvedAt: Timestamp.now() as any,
      itemId,
    };

    await addDoc(collection(db, 'lostAndFoundLogs'), logData);

    // Notify the poster
    await notifySpecificUser(
      item.userId,
      'Your Lost Item Was Found!',
      `${claimerEmail} has found your ${item.itemName}. Contact: ${claimerPhone}`,
      { type: 'lost_found', itemId, claimerEmail, claimerPhone }
    );

    // Delete from Cloudinary
    // Note: Implement backend endpoint for secure deletion
    // await deleteFromCloudinary(item.cloudinaryPublicId, ...);

    // Delete from lostItems collection
    await deleteDoc(doc(db, 'lostItems', itemId));
  } catch (error) {
    console.error('Error claiming found lost item:', error);
    throw error;
  }
};

export const claimFoundItem = async (
  itemId: string,
  claimerUserId: string,
  claimerEmail: string,
  claimerPhone: string,
  item: FoundItem
): Promise<void> => {
  try {
    // Create log entry
    const logData: Omit<LostAndFoundLog, 'id'> = {
      type: 'found',
      itemName: item.itemName,
      description: item.description,
      location: item.foundLocation,
      imageUrl: item.imageUrl,
      posterUserId: item.userId,
      posterEmail: item.userEmail,
      posterPhone: item.userPhone,
      claimerUserId,
      claimerEmail,
      claimerPhone,
      dateTime: item.dateFound,
      resolvedAt: Timestamp.now() as any,
      itemId,
    };

    await addDoc(collection(db, 'lostAndFoundLogs'), logData);

    // Notify the poster (finder)
    await notifySpecificUser(
      item.userId,
      'Someone Claimed Your Found Item!',
      `${claimerEmail} claims the ${item.itemName} you found. Contact: ${claimerPhone}`,
      { type: 'item_claimed', itemId, claimerEmail, claimerPhone }
    );

    // Delete from Cloudinary
    // Note: Implement backend endpoint for secure deletion
    // await deleteFromCloudinary(item.cloudinaryPublicId, ...);

    // Delete from foundItems collection
    await deleteDoc(doc(db, 'foundItems', itemId));
  } catch (error) {
    console.error('Error claiming found item:', error);
    throw error;
  }
};

export const removeLostItem = async (
  itemId: string,
  cloudinaryPublicId: string
): Promise<void> => {
  try {
    // Delete from Cloudinary
    // Note: Implement backend endpoint for secure deletion
    // await deleteFromCloudinary(cloudinaryPublicId, ...);

    // Delete from lostItems collection
    await deleteDoc(doc(db, 'lostItems', itemId));
  } catch (error) {
    console.error('Error removing lost item:', error);
    throw error;
  }
};

export const removeFoundItem = async (
  itemId: string,
  cloudinaryPublicId: string
): Promise<void> => {
  try {
    // Delete from Cloudinary
    // Note: Implement backend endpoint for secure deletion
    // await deleteFromCloudinary(cloudinaryPublicId, ...);

    // Delete from foundItems collection
    await deleteDoc(doc(db, 'foundItems', itemId));
  } catch (error) {
    console.error('Error removing found item:', error);
    throw error;
  }
};

export const subscribeLostItems = (
  callback: (items: LostItem[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'lostItems'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items: LostItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dateLost: doc.data().dateLost.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as LostItem[];

    callback(items);
  });
};

export const subscribeFoundItems = (
  callback: (items: FoundItem[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'foundItems'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items: FoundItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dateFound: doc.data().dateFound.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as FoundItem[];

    callback(items);
  });
};