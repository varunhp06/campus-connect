// src/config/featuresRegistry.ts

export type UserRole = "student" | "staff" | "admin" | "sportsAdmin" | "sportsOfficer" | "coach" | "guard";

export interface AppFeature {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  route: string; // expo-router path
  icon?: string; // optional Ionicons icon
  roles: UserRole[]; // who can access the feature
}

// Global list of all searchable features in the app
export const FEATURES: AppFeature[] = [
  // CAMPUS UTILITIES
  {
    id: "canteen_cart",
    title: "My Cart",
    description: "View and manage food items in your cart",
    keywords: ["cart", "food", "canteen", "order"],
    route: "/campus-utilities/Canteen",
    icon: "cart",
    roles: ["student", "staff", "admin"],
  },
  {
    id: "canteen_history",
    title: "Order History",
    description: "View all your completed canteen orders",
    keywords: ["history", "order", "past", "canteen"],
    route: "/campus-utilities/Canteen/OrderHistory",
    icon: "timer",
    roles: ["student", "staff", "admin"],
  },
  {
    id: "sports",
    title: "Sports Section",
    description: "Submit issues and request equipment",
    keywords: ["sports", "equipment", "complaint"],
    route: "/campus-utilities/Sports",
    icon: "football",
    roles: ["student", "staff", "admin"],
  },

  // NEW: INVENTORY REQUEST / RENTING
  {
    id: "sports_inventory_request",
    title: "Rent / Request Sports Equipment",
    description: "Request sports items from inventory",
    keywords: ["rent", "inventory", "sports", "equipment", "request"],
    route: "/campus-utilities/Sports/InventoryRequest",
    icon: "cube",
    roles: [ "sportsAdmin", "sportsOfficer"],
  },

  // NEW: SPORTS ADMIN PANEL
  {
    id: "sports_inventory_management",
    title: "Sports Admin Inventory Panel",
    description: "Manage item approvals, logs & returns",
    keywords: ["inventory", "sports", "admin", "manage", "logs"],
    route: "/sports-admin/InventoryDashboard",
    icon: "construct",
    roles: ["sportsAdmin", "sportsOfficer"],
  },

  // NEW: COACH ENTRY LOGS
  {
    id: "coach_entry_logs",
    title: "Coach Entry Logs",
    description: "Maintain entry/exit logs for coaches",
    keywords: ["coach", "entry", "logs"],
    route: "/campus-utilities/Sports/EntryLogs",
    icon: "clipboard",
    roles: ["coach"],
  },
  {
    id: "coach_entry_logs",
    title: "Coach Attendance",
    description: "Maintain entry/exit logs for coaches",
    keywords: ["coach", "entry", "logs"],
    route: "/campus-utilities/Sports/EntryLogs",
    icon: "clipboard",
    roles: ["sportsAdmin"],
  },

  // NEW: QR SCANNING FOR GUARD
  {
    id: "guard_qr_scan",
    title: "QR Scanner",
    description: "Scan student/coach QR for entry",
    keywords: ["qr", "scan", "guard", "security"],
    route: "/security/QRScanner",
    icon: "qr-code",
    roles: ["guard", "sportsOfficer"],
  },

  {
    id: "cycle_rental",
    title: "Cycle Rental",
    description: "Rent cycles inside campus",
    keywords: ["cycle", "rent", "bike"],
    route: "/campus-utilities/CycleSection",
    icon: "bicycle",
    roles: ["student", "staff", "admin"],
  },

  {
    id: "administration",
    title: "Administration Contacts",
    description: "Browse department and staff contacts",
    keywords: ["admin", "teachers", "contacts", "faculty"],
    route: "/campus-services/administration",
    icon: "people",
    roles: ["student", "staff", "admin"],
  },
  {
    id: "lost_and_found",
    title: "Lost & Found",
    description: "Report or find lost items",
    keywords: ["lost", "found", "items"],
    route: "/campus-services/LostAndFoundSection",
    icon: "help-buoy",
    roles: ["student", "staff", "admin"],
  },
  {
    id: "faq",
    title: "FAQs",
    description: "Common questions & support",
    keywords: ["faq", "help", "support", "information"],
    route: "/campus-services/faq",
    icon: "information-circle",
    roles: ["student", "staff", "admin"],
  },

  // ADMIN
  {
    id: "admin_dashboard",
    title: "Admin Dashboard",
    description: "Manage campus utilities & users",
    keywords: ["admin", "dashboard", "manage"],
    route: "/admin/dashboard",
    icon: "settings",
    roles: ["admin"],
  },
];
