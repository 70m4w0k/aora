import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../hooks/useTranslation";

const { width } = Dimensions.get("window");
const SCAN_AREA_SIZE = width * 0.7;

const COLORS = {
  background: '#0A0A0C',
  surface: '#111114',
  card: '#1A1A1F',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  accent: '#06B6D4',
  success: '#10B981',
};

const BarcodeScanner = ({ visible, onClose, onBarcodeScanned }) => {
  const t = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanLineAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setScanned(false);
      startScanAnimation();
    }
  }, [visible]);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    
    // Vibration feedback would go here
    onBarcodeScanned({ type, data });
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  if (!permission) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {!permission.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.permissionTitle}>{t("common.cameraPermissionRequired")}</Text>
            <Text style={styles.permissionText}>
              {t("prices.cameraAccessForBarcodeScanning")}
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>{t("prices.grantPermission")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "code93",
                  "qr",
                ],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("prices.scanBarcode")}</Text>
                <View style={{ width: 44 }} />
              </View>

              {/* Scan Area */}
              <View style={styles.scanAreaContainer}>
                <View style={styles.scanArea}>
                  {/* Corner brackets */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  
                  {/* Scanning line */}
                  {!scanned && (
                    <Animated.View 
                      style={[
                        styles.scanLine,
                        { transform: [{ translateY: scanLineTranslate }] }
                      ]} 
                    />
                  )}

                  {/* Scanned indicator */}
                  {scanned && (
                    <View style={styles.scannedIndicator}>
                      <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                    </View>
                  )}
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.footer}>
                <Text style={styles.instructionText}>
                  {scanned 
                    ? t("prices.barcodeScanned") 
                    : t("prices.positionBarcodeInFrame")
                  }
                </Text>
                {scanned && (
                  <TouchableOpacity 
                    style={styles.scanAgainButton} 
                    onPress={() => setScanned(false)}
                  >
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={styles.scanAgainText}>{t("prices.scanAgain")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Permission Screen
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },

  // Scan Area
  scanAreaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: COLORS.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  scannedIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // Footer
  footer: {
    paddingBottom: 60,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 16,
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  scanAgainText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default BarcodeScanner;

