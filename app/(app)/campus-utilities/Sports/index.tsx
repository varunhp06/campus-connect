import React, { useEffect, useState } from "react";
import { ThemedLayout } from "@/components/ThemedLayout";
import { ServiceContent } from "@/components/ServiceContent";
import { auth } from "@/firebaseConfig";

export default function SportsSection() {
  const [isSportsAdmin, setIsSportsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSportsCoach, setIsSportsCoach] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setIsSportsAdmin(tokenResult.claims.sportMentor === true);
        setIsSportsCoach(tokenResult.claims.Coach === true);
      }
      setLoading(false);
    };

    checkAdminStatus();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdminStatus();
      } else {
        setIsSportsAdmin(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  console.log("sgds")

  const serviceButtons = isSportsAdmin
    ? [
        {
          id: "inventory",
          title: "Inventory",
          description: "Manage sports inventory",
          color: "#4CAF50",
          route: "/(app)/campus-utilities/Sports/Inventory",
        },
      ]
    : isSportsCoach
    ? [
        {
          id: "entryLog",
          title: "Entry Log",
          description: "Record coach attendance & timing",
          color: "#4CAF50",
          route: "/(app)/campus-utilities/Sports/EntryLogs",
        },
      ]
    : [
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
        {
          id: "Scan QR",
          title: "Complaint",
          description: "Report issues and get quick support",
          color: "#4CAF50",
          route: "/(app)/campus-utilities/Sports/ScanQr",
        },
      ];

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
