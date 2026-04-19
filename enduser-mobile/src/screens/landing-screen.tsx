import { useRouter } from "expo-router";
import { Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/src/theme";

const { width, height } = Dimensions.get("window");

export function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/bg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            {/* Top Logo Centered */}
            <View style={[styles.navbarWrapper, { alignItems: 'center', paddingTop: 40 }]}>
              <View style={[styles.logoContainer, { marginRight: 0 }]}>
                <Image source={require("../../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>

            {/* Hero Section */}
            <View style={styles.contentSection}>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.brandText}>BayaniHub</Text>

              <View style={styles.heroLines}>
                <Text style={styles.heroLineText}>Right <Text style={styles.heroHighlightText}>People</Text>.</Text>
                <Text style={styles.heroLineText}>Right <Text style={styles.heroHighlightText}>Resources</Text>.</Text>
                <Text style={styles.heroLineText}>Right <Text style={styles.heroHighlightText}>Now</Text>.</Text>
              </View>

              <Text style={styles.descriptionText}>
                BayaniHub is a unified resource management engine designed to empower modern-day heroes. By managing both manpower and material aid in one place, we help disaster response teams forecast needs, avoid bottlenecks, and deploy aid efficiently.
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push("/signup")}
                >
                  <Text style={styles.primaryButtonText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.secondaryButtonText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
          
          {/* Footer outside SafeAreaView to touch the absolute bottom */}
          <View style={styles.footer} />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Dark overlay for readability
  },
  safeArea: {
    flex: 1,
  },
  navbarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20, // Nudged down from 10
  },
  navbarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5C6ED5", // Updated color as requested
    borderRadius: 25,
    padding: 8,
    height: 72,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#5C6DCB", // Vibrant blue from original design
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  navLinks: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navLinkText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
  authPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  authPillText: {
    color: "#2B4C8C",
    fontWeight: "700",
    fontSize: 14,
  },
  authDivider: {
    width: 1,
    height: 15,
    backgroundColor: "#2B4C8C",
    opacity: 0.3,
  },
  contentSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    marginTop: -40,
  },
  welcomeText: {
    fontSize: 18,
    fontStyle: "italic",
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 0,
  },
  brandText: {
    fontSize: 48,
    fontWeight: "600",
    color: "#7DA0FF",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  heroLines: {
    alignItems: "center",
    marginBottom: 30,
  },
  heroLineText: {
    fontSize: 36,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 5,
  },
  heroHighlightText: {
    color: "#7DA0FF", // Light blue highlight
  },
  descriptionText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 40,
    fontWeight: "400",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 40,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 15,
    backgroundColor: "#3E5C96",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#3E5C96",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    width: "100%",
    height: 60,
    backgroundColor: "#426FB0",
    position: "absolute",
    bottom: 0,
  },
});
