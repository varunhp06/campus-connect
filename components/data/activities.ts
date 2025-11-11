export interface ActivityItem {
  id: string;
  date: string;
  tab: 'SPORTS' | 'CULT' | 'TECH';
  month: string;
  year: number;
  title: string;
  description: string;
}

export const activities: ActivityItem[] = [
  { id: '1', date: '25', tab: 'SPORTS', month: 'SEP', year: 2024, title: 'Annual Sports Meet', description: 'Inter-department athletics, track & field, and team games' },
  { id: '2', date: '30', tab: 'SPORTS', month: 'SEP', year: 2024, title: 'College Marathon Run', description: 'A 5K/10K run event for all students and faculty' },
  { id: '3', date: '10', tab: 'SPORTS', month: 'OCT', year: 2024, title: 'Indoor Sports Festival', description: 'Badminton, Table Tennis, Chess, and Carrom competitions' },
  { id: '5', date: '12', tab: 'CULT', month: 'OCT', year: 2024, title: 'Inter-College Cult Cup', description: 'Watch top city colleges for a knockout-style tournament' },
  { id: '7', date: '14', tab: 'CULT', month: 'OCT', year: 2024, title: 'Inter-College Dance Cup', description: 'City colleges compete in dance battles' },
  { id: '8', date: '15', tab: 'TECH', month: 'NOV', year: 2025, title: 'Tech Hackathon', description: '24-hour coding competition with prizes' },
  { id: '9', date: '20', tab: 'SPORTS', month: 'NOV', year: 2025, title: 'Basketball Tournament', description: 'Inter-hostel basketball championship' },
  { id: '10', date: '25', tab: 'CULT', month: 'DEC', year: 2025, title: 'Winter Cultural Fest', description: 'Music, dance, and drama performances' },
  { id: '11', date: '5', tab: 'TECH', month: 'JAN', year: 2026, title: 'AI Workshop Series', description: 'Learn about machine learning and AI' },
  { id: '12', date: '15', tab: 'SPORTS', month: 'FEB', year: 2026, title: 'Cricket Premier League', description: 'Annual inter-hostel cricket tournament' },
];
