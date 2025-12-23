import React, { useEffect, useState } from "react";
import { ThemedLayout } from "@/components/ThemedLayout";
import { ServiceContent } from "@/components/ServiceContent";
import { auth } from "@/firebaseConfig";

export default function SportsSection() {
  const [isSportsMentor, setIsSportsMentor] = useState(false);
  const [isSportsAdmin, setisSportsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSportsCoach, setIsSportsCoach] = useState(false);
  const [isGuard, setIsGuard] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setIsSportsMentor(tokenResult.claims.sportMentor === true);
        setIsSportsCoach(tokenResult.claims.Coach === true);
        setisSportsAdmin(tokenResult.claims.sportAdmin === true);
        setIsGuard(tokenResult.claims.guard === true);
      }
      setLoading(false);
    };

    checkAdminStatus();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdminStatus();
      } else {
        setIsSportsMentor(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  console.log("sgds");

  let serviceButtons = [
    {
      id: "rent",
      title: "Rent Equipment",
      description: "Rent gear, fast and easy.",
      color: "#4CAF50",
      route: "/(app)/campus-utilities/Sports/Rent",
    },
    {
      id: "return",
      title: "Return Equipment",
      description: "Quick and easy equipment returns",
      color: "#4CAF50",
      route: "/(app)/campus-utilities/Sports/Return",
    },
    {
      id: "complaint",
      title: "Complaint",
      description: "Report issues and get quick support",
      color: "#4CAF50",
      route: "",
    },
  ];
  
  if (isSportsMentor) {
    serviceButtons = [
      {
        id: "inventory",
        title: "Inventory",
        description: "Manage sports inventory",
        color: "#4CAF50",
        route: "/(app)/campus-utilities/Sports/Inventory",
      },
      {
        id: "coachLogs",
        title: "Coach Attendance",
        description: "View Coach Attendance",
        color: "#4CAF50",
        route: "/(app)/campus-utilities/Sports/CoachAttendance",
      },
      {
        id: "requestApproval",
        title: "Request Approval",
        description: "Approve Rent Request",
        color: "#4CAF50",
        route: "/(app)/campus-utilities/Sports/Request",
      },
    ];
  } else if (isSportsAdmin) {
    serviceButtons = [
      {
        id: "inventory",
        title: "Inventory",
        description: "Manage sports inventory",
        color: "#4CAF50",
        route: "/(app)/campus-utilities/Sports/Inventory",
      },
      {
        id: "requestApproval",
        title: "Request Approval",
        description: "Approve Rent Request",
        color: "#4CAF50",
        route: "/(app)/campus-utilities/Sports/Request",
      },
    ];
  } else if (isSportsCoach) {
    serviceButtons = [
      {
        id: "entryLogs",
        title: "Entry Logs",
        description: "Entry / Exit Logs",
        color: "#4CAF50",
        route: "/(app)/campus-utilities/Sports/EntryLogs",
      },
    ];
  } else if (isGuard) {
    serviceButtons = [
      {
        id: "scanQr",
        title: "Scan QR",
        description: "Scan QR Code",
        color: "#4CAF50",
        route: "/(app)/campus-utilities/Sports/ScanQr",
      },
    ];
  }

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <ServiceContent
        icon="basketball"
        title="Sports Service"
        buttons={serviceButtons}
        bottomImage={require("@/assets/images/backgrounds/sports.png")}
      />
    </ThemedLayout>
  );
}
