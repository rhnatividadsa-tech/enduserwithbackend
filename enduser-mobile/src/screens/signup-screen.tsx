import { useRouter } from "expo-router";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/src/providers/auth-provider";
import { COLORS } from "@/src/theme";

export function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [idDocument, setIdDocument] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIdDocument({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
        });
      }
    } catch (err) {
      console.log("Error picking document:", err);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!dob.trim()) {
      setError("Date of birth is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!idDocument) {
      setError("A valid ID document (JPG, PNG, or PDF) is required.");
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        dob: dob.trim(),
        id_document: idDocument,
      });
      setSuccess(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create account.");
    } finally {
      setIsLoading(false);
    }
  };

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

            <Text style={styles.headerTitle}>CREATE YOUR ACCOUNT</Text>

            {error ? (
              <View style={styles.alertError}>
                <Text style={styles.alertTextError}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.alertSuccess}>
                <Text style={styles.alertTextSuccess}>Account created! Check your email to verify, then log in.</Text>
              </View>
            ) : null}

            {/* Inputs Region */}
            <View style={styles.fieldsContainer}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address*"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name*"
                placeholderTextColor="#666"
                style={styles.input}
              />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name*"
                placeholderTextColor="#666"
                style={styles.input}
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone Number* (e.g. 09171234567)"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                value={dob}
                onChangeText={setDob}
                placeholder="Date of Birth* (YYYY-MM-DD)"
                placeholderTextColor="#666"
                style={styles.input}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password*"
                placeholderTextColor="#666"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password*"
                placeholderTextColor="#666"
                secureTextEntry
                style={styles.input}
              />
              <TouchableOpacity style={styles.documentPickerBtn} onPress={pickDocument}>
                <Text style={styles.documentPickerBtnText}>Upload ID Document*</Text>
              </TouchableOpacity>
              {idDocument && (
                <Text style={styles.documentNameText}>Selected: {idDocument.name}</Text>
              )}
            </View>

            {/* Submit Region */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading ? styles.submitDisabled : null]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create an Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5", /* Bleeds into the bottom area if scrolled */
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
  },
  topImageBanner: {
    width: "100%",
    height: 300,
    backgroundColor: "#2965A2", /* Deep community background placeholder */
    position: "absolute",
    top: 0,
    left: 0,
  },
  formContainer: {
    marginTop: 220, // Pushes down to overlap the banner
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
    marginBottom: 30,
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#465997", /* Matches the primary dark / logo blue */
    marginBottom: 28,
  },
  alertError: {
    width: "100%",
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  alertTextError: {
    color: "#B11616",
    fontSize: 13,
    textAlign: "center",
  },
  alertSuccess: {
    width: "100%",
    backgroundColor: "#EFFBF3",
    borderColor: "#B8E5C8",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  alertTextSuccess: {
    color: COLORS.success,
    fontSize: 13,
    textAlign: "center",
  },
  fieldsContainer: {
    width: "100%",
    gap: 16,
    marginBottom: 40,
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C5C5C5",
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  documentPickerBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#465997",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF2F8",
    marginTop: 8,
  },
  documentPickerBtnText: {
    color: "#465997",
    fontSize: 14,
    fontWeight: "600",
  },
  documentNameText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: -8,
  },
  submitButton: {
    width: "75%",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#465997",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#333",
  },
  footerLink: {
    fontSize: 13,
    color: "#465997",
    fontWeight: "700",
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
