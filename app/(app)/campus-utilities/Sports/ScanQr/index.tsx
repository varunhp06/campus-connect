import { useDialog } from "@/components/DialogContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { useToast } from "@/components/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from "react-native";
import { auth, db } from "../../../../../firebaseConfig";

const title = "Scan QR";

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const successAnim = useState(new Animated.Value(0))[0];

  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!permission) requestPermission();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    // Vibrate feedback (optional)
    Vibration.vibrate(100);

    try {
      const scannedData = JSON.parse(data);
      setScanResult(scannedData);

      // Validate QR code type
      if (scannedData.action === "attendance") {
        await handleAttendanceQR(scannedData);
      } else if (scannedData.type === "equipment_rental") {
        await handleEquipmentQR(scannedData);
      } else {
        throw new Error("Unknown QR code type");
      }
    } catch (error: any) {
      console.error("Scan error:", error);
      showDialog({
        title: 'Invalid QR Code',
        message: error.message || 'This QR code format is not supported',
        buttons: [
          {
            text: 'Scan Again',
            onPress: resetScanner,
          },
        ],
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAttendanceQR = async (scannedData: any) => {
    try {
      // Store attendance log in Firestore
      const attendanceLog = {
        coachId: scannedData.coachId,
        coachName: scannedData.coachName,
        timestamp: Timestamp.now(),
        type: scannedData.type, // "entry" or "exit"
        scannedBy: currentUser?.uid || "unknown",
        scannedByName: currentUser?.displayName || currentUser?.email || "Unknown",
        qrTimestamp: scannedData.timestamp,
      };

      await addDoc(collection(db, "attendanceLogs"), attendanceLog);

      // Show success animation
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      showDialog({
        title: '✓ Success',
        message: `${scannedData.type === "entry" ? "Entry" : "Exit"} logged successfully for ${scannedData.coachName}`,
        buttons: [
          {
            text: 'Scan Another',
            onPress: resetScanner,
          },
        ],
      });
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      throw new Error("Failed to save attendance log");
    }
  };

  const handleEquipmentQR = async (scannedData: any) => {
    try {
      // Store equipment rental log in Firestore
      const rentalLog = {
        equipmentId: scannedData.equipmentId,
        equipmentName: scannedData.equipmentName,
        sport: scannedData.sport,
        userName: scannedData.userName,
        userId: scannedData.userId,
        quantity: scannedData.quantity,
        timestamp: Timestamp.now(),
        qrGeneratedAt: scannedData.timestamp,
        qrDate: scannedData.date,
        notes: scannedData.notes || "",
        scannedBy: currentUser?.uid || "unknown",
        scannedByName: currentUser?.displayName || currentUser?.email || "Unknown",
        status: "rented",
      };

      await addDoc(collection(db, "equipmentRentals"), rentalLog);

      // Show success animation
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      showDialog({
        title: '✓ Equipment Rented',
        message: `${scannedData.equipmentName} (${scannedData.quantity} units) rented to ${scannedData.userName}`,
        buttons: [
          {
            text: 'Scan Another',
            onPress: resetScanner,
          },
        ],
      });
    } catch (error: any) {
      console.error("Error saving equipment rental:", error);
      throw new Error("Failed to save equipment rental");
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
    setProcessing(false);
  };

  if (!permission) {
    return (
      <ThemedLayout
        showNavbar={true}
        navbarConfig={{
          showHamburger: true,
          showTitle: true,
          showThemeToggle: true,
        }}
      >
        <ServiceLayout icon="qr-code-sharp" title={title} showTitle={true}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#228f16ff" />
            <Text
              style={[
                styles.statusText,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Requesting camera permission...
            </Text>
          </View>
        </ServiceLayout>
      </ThemedLayout>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedLayout
        showNavbar={true}
        navbarConfig={{
          showHamburger: true,
          showTitle: true,
          showThemeToggle: true,
        }}
      >
        <ServiceLayout icon="qr-code-sharp" title={title} showTitle={true}>
          <View style={styles.centerContainer}>
            <View
              style={[
                styles.permissionIcon,
                { backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9" },
              ]}
            >
              <Ionicons
                name="camera-off-outline"
                size={48}
                color={isDarkMode ? "#64748B" : "#94A3B8"}
              />
            </View>
            <Text
              style={[
                styles.permissionTitle,
                { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
              ]}
            >
              Camera Permission Required
            </Text>
            <Text
              style={[
                styles.permissionText,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              We need access to your camera to scan QR codes
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </ServiceLayout>
      </ThemedLayout>
    );
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
      <ServiceLayout icon="qr-code-sharp" title={title} showTitle={true}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            >
              {/* Scanner Overlay */}
              <View style={styles.overlay}>
                {/* Top Overlay */}
                <View style={styles.overlaySection} />

                {/* Middle Section with Frame */}
                <View style={styles.middleSection}>
                  <View style={styles.overlaySection} />
                  <View style={styles.scanFrame}>
                    {/* Corner Decorations */}
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />

                    {/* Scanning Line Animation */}
                    {!scanned && (
                      <View style={styles.scanLineContainer}>
                        <Animated.View style={styles.scanLine} />
                      </View>
                    )}

                    {/* Processing Indicator */}
                    {processing && (
                      <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.processingText}>Processing...</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.overlaySection} />
                </View>

                {/* Bottom Overlay */}
                <View style={styles.overlaySection} />
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <View style={styles.instructionCard}>
                  <Ionicons name="qr-code-outline" size={32} color="#228f16ff" />
                  <Text style={styles.instructionTitle}>
                    {scanned ? "QR Code Scanned!" : "Align QR Code"}
                  </Text>
                  <Text style={styles.instructionText}>
                    {scanned
                      ? "Processing your scan..."
                      : "Position the QR code within the frame"}
                  </Text>
                </View>

                {/* Scan Again Button */}
                {scanned && !processing && (
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={resetScanner}
                  >
                    <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.rescanButtonText}>Scan Again</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Success Overlay */}
              <Animated.View
                style={[
                  styles.successOverlay,
                  {
                    opacity: successAnim,
                    transform: [
                      {
                        scale: successAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <View style={styles.successCard}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
                  </View>
                  <Text style={styles.successTitle}>Success!</Text>
                  <Text style={styles.successText}>
                    Data saved to database
                  </Text>
                </View>
              </Animated.View>
            </CameraView>
          </View>

          {/* Bottom Info Bar */}
          <View
            style={[
              styles.infoBar,
              { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" },
            ]}
          >
            <View style={styles.infoItem}>
              <Ionicons
                name="person-outline"
                size={16}
                color={isDarkMode ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.infoText,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                {currentUser?.displayName || currentUser?.email || "Unknown"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="scan-outline"
                size={16}
                color="#228f16ff"
              />
              <Text style={[styles.infoText, { color: "#228f16ff" }]}>
                Ready to Scan
              </Text>
            </View>
          </View>
        </Animated.View>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Permission Screen
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#228f16ff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Camera
  cameraContainer: {
    flex: 1,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlaySection: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  middleSection: {
    flexDirection: "row",
    height: 280,
  },
  scanFrame: {
    width: 280,
    height: 280,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#228f16ff",
    borderRadius: 16,
    position: "relative",
  },

  // Corner Decorations
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },

  // Scan Line
  scanLineContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanLine: {
    width: "90%",
    height: 2,
    backgroundColor: "#228f16ff",
    shadowColor: "#228f16ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },

  // Processing
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Instructions
  instructionsContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: "center",
    gap: 16,
  },
  instructionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  instructionText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  // Rescan Button
  rescanButton: {
    backgroundColor: "#228f16ff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rescanButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  // Success Overlay
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  successText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },

  // Info Bar
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
  },
});