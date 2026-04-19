import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthShell, authStyles } from "@/src/components/auth-shell";
import { API_BASE } from "@/src/lib/api";
import { COLORS } from "@/src/theme";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "No account found with that email address.");
        return;
      }

      // Email exists — go directly to reset password
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}` as any);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="RESET PASSWORD"
      subtitle="Enter your registered email address to reset your password."
      footer={
        <>
          <Text style={{ fontSize: 11 }}>Back to </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.primaryDark }}>
              Login
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      {error ? (
        <View style={authStyles.alertError}>
          <Text style={authStyles.alertTextError}>{error}</Text>
        </View>
      ) : null}

      <View style={authStyles.field}>
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          placeholder="Email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          style={authStyles.input}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[authStyles.submit, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={authStyles.submitText}>Continue</Text>
        )}
      </TouchableOpacity>
    </AuthShell>
  );
}
