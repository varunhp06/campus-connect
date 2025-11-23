import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

export interface ActivityItem {
  id: string;
  date: string;
  tab: 'SPORTS' | 'CULT' | 'TECH';
  month: string;
  year: number;
  title: string;
  description: string;
}

export async function fetchActivities(): Promise<ActivityItem[]> {
  try {
    const eventsRef = collection(db, 'events');
    const querySnapshot = await getDocs(eventsRef);
    
    const activities: ActivityItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        date: data.date,
        tab: data.tab,
        month: data.month,
        year: data.year,
        title: data.title,
        description: data.description,
      });
    });
    
    activities.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthA = months.indexOf(a.month);
      const monthB = months.indexOf(b.month);
      
      if (monthA !== monthB) {
        return monthA - monthB;
      }
      
      return parseInt(a.date) - parseInt(b.date);
    });
    
    return activities;
  } catch (error) {
    console.error('Error fetching activities from Firestore:', error);
    return [];
  }
}