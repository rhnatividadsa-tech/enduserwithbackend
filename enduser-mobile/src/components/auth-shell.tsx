import { ReactNode } from "react";
import { useRouter } from "expo-router";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "@/src/theme";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Image source={require("../../assets/bg.png")} style={styles.topImageBanner} resizeMode="cover" />

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace("/landing")}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <View style={styles.logoPillWrapper}>
              <View style={styles.logoPill}>
                <Image source={require("../../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>

            <Text style={styles.welcome}>Welcome to</Text>
            <Text style={styles.brand}>BayaniHub</Text>

            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            <View style={styles.childrenContainer}>
              {children}
            </View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  alertError: {
    width: "100%",
    backgroundColor: "#FFF0F0",
    borderColor: "#FFB3B3",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  alertSuccess: {
    width: "100%",
    backgroundColor: "#EFFBF3",
    borderColor: "#B8E5C8",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  alertTextError: {
    color: "#B11616",
    fontSize: 13,
  },
  alertTextSuccess: {
    color: COLORS.success,
    fontSize: 13,
  },
  field: {
    width: "100%",
    marginBottom: 12,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C5C5C5",
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 11,
    color: COLORS.danger,
  },
  passwordBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C5C5C5",
    paddingLeft: 16,
    paddingRight: 12,
    backgroundColor: COLORS.white,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  toggle: {
    color: "#465997",
    fontSize: 13,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C5C5C5",
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#465997",
    borderColor: "#465997",
  },
  checkboxCheckmark: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#465997",
    fontWeight: "600",
  },
  link: {
    color: "#465997",
    fontSize: 12,
    fontWeight: "700",
  },
  submit: {
    width: "75%",
    height: 50,
    alignSelf: "center",
    borderRadius: 14,
    backgroundColor: "#465997",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 14,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#666",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  socialText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.black,
  },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
  },
  topImageBanner: {
    width: "100%",
    height: 300,
    position: "absolute",
    top: 0,
    left: 0,
  },
  formContainer: {
    marginTop: 220,
    minHeight: 600,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 30,
    paddingBottom: 60,
    alignItems: "center",
  },
  logoPillWrapper: {
    marginTop: -55, 
    marginBottom: 20,
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 30,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  logoPill: {
    width: 80,
    height: 90,
    borderRadius: 20,
    backgroundColor: "#5C6DCB", 
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 45,
    height: 45,
  },
  welcome: {
    fontSize: 16,
    fontStyle: "italic",
    fontWeight: "300",
    color: "#333",
    marginBottom: 2,
  },
  brand: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 1,
    color: COLORS.primaryDark,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#465997",
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSoft,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 24,
  },
  childrenContainer: {
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
