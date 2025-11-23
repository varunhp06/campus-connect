import React, { useEffect, useState } from "react";
import { ThemedLayout } from "@/components/ThemedLayout";
import { ServiceContent } from "@/components/ServiceContent";
import { db } from "../../../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  CollectionReference,
} from "firebase/firestore";

interface shop {
  id: string;
  name: string;
  status: string;
}

export default function NightDeliverySection() {
  const [loading, setLoading] = useState(false);
  const [shopData, setShopData] = useState<shop[]>([]);

  const serviceButtons = shopData.map((shop) => ({
    id: shop.id,
    title: shop.name,
    description: `Order food from ${shop.name}`,
    color: "#2196F3",
    route: `/(app)/campus-utilities/Canteen/${shop.id}`,
    status: shop.status?.toLowerCase() === "online" ? "Online" : "Offline",
  }));

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const shopRef = collection(db, "shops") as CollectionReference<
        Omit<shop, "id">
      >;
      const snapshot = await getDocs(shopRef);
      const list: shop[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<shop, "id">;
        return { id: docSnap.id, ...data };
      });
      setShopData(list);
      console.log("Fetched Shops:", list);
    } catch (error) {
      console.log("Error fetching Shops:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

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
        icon="pizza"
        title="Night Delivery"
        buttons={serviceButtons}
        bottomImage={require("@/assets/images/backgrounds/night-delivery.png")}
      />
    </ThemedLayout>
  );
}
