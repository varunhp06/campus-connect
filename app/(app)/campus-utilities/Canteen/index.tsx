import { ServiceContent } from "@/components/ServiceContent";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { useToast } from "@/components/ToastContext";
import {
  collection,
  CollectionReference,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { auth, db } from "../../../../firebaseConfig";

interface shop {
  id: string;
  name: string;
  status: string;
}

export default function NightDeliverySection() {
  const [loading, setLoading] = useState(false);
  const [shopData, setShopData] = useState<shop[]>([]);
  const [isUser, setIsUser] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorShopId, setVendorShopId] = useState<string | null>(
    "uMs7DQkbWE4jLLnUHxYQ"
  );
  const [shopStatus, setShopStatus] = useState(false);
  const { theme } = useTheme()

  const serviceButtons = shopData.map((shop) => ({
    id: shop.id,
    title: shop.name,
    description: `Order food from ${shop.name}`,
    color: "#2196F3",
    route: `/(app)/campus-utilities/Canteen/User/${shop.id}`,
    status: shop.status.toLowerCase() === "online" ? "Online" : "Offline",
  }));

  const vendorData = [
    {
      id: "orders",
      title: "Order Management",
      description: "Manage pending / active orders",
      color: "#0783e9ff",
      route: "/(app)/campus-utilities/Canteen/Vendor/Orders",
    },
    {
      id: "inventory",
      title: "Inventory Management",
      description: "Manage you Menu / Inventory",
      color: "#0783e9ff",
      route: "/(app)/campus-utilities/Canteen/Vendor/Inventory",
    },
    {
      id: "analytics",
      title: "Analytics / Report",
      description: "View your Analytics",
      color: "#0783e9ff",
      route: "/(app)/campus-utilities/Canteen/Vendor/Report",
    },
  ];

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setIsUser(tokenResult.claims.Vendor !== true);
        setIsVendor(tokenResult.claims.Vendor === true);

        // If vendor, fetch their shop ID
        if (tokenResult.claims.Vendor === true) {
          await fetchVendorShop(user.uid);
        }
      }
      setLoading(false);
    };

    checkAdminStatus();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdminStatus();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchVendorShop = async (userId: string) => {
    try {
      const shopRef = collection(db, "shops");
      const q = query(shopRef, where("vendorId", "==", userId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const shopDoc = snapshot.docs[0];
        const shopData = shopDoc.data() as Omit<shop, "id">;

        setVendorShopId(shopDoc.id);
        setShopStatus(shopData.status.toLowerCase() === "online");
      }
    } catch (error) {
      console.log("Error fetching vendor shop:", error);
    }
  };

  const { showToast } = useToast();

  const toggleShopStatus = async (newStatus: boolean) => {
    if (!vendorShopId) {
      showToast("Shop not found", "error");
      return;
    }

    try {
      setLoading(true);
      const shopRef = doc(db, "shops", vendorShopId);
      await updateDoc(shopRef, {
        status: newStatus ? "online" : "offline",
        updatedAt: serverTimestamp(),
      });

      setShopStatus(newStatus);
      showToast(`Shop is now ${newStatus ? "Online" : "Offline"}`, "success");
    } catch (error) {
      console.error("Error updating shop status:", error);
      showToast("Failed to update shop status", "error");
      // Revert the toggle if update fails
      setShopStatus(!newStatus);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
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
      const filterList = list.filter((item) => item.status === "online");
      setShopData(list);
      console.log("Fetched Shops:", list);
    } catch (error) {
      console.log("Error fetching Shops:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUser) {
      fetchShops();
    }
  }, [isUser]);

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      {isVendor && (
        <View
          style={[styles.statusContainer , {backgroundColor : theme.inputBackground  }]}
        >
          <Text style={[styles.statusLabel , {color : theme.primaryText}]}>
            Shop Status: {shopStatus ? "Online" : "Offline"}
          </Text>
          <Switch
            value={shopStatus}
            onValueChange={toggleShopStatus}
            disabled={loading}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={shopStatus ? "#2196F3" : "#f4f3f4"}
          />
        </View>
      )}

        <ServiceContent
          icon="pizza"
          title="Night Delivery"
          buttons={isVendor ? vendorData : serviceButtons}
          bottomImage={require("@/assets/images/backgrounds/night-delivery.png")}
        />
     
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor : "#008cffff"
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
