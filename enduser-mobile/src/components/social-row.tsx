import { Image, Text, TouchableOpacity, View } from "react-native";
import { authStyles } from "@/src/components/auth-shell";

export function SocialRow() {
  return (
    <>
      <View style={authStyles.dividerRow}>
        <View style={authStyles.dividerLine} />
        <Text style={authStyles.dividerText}>OR</Text>
        <View style={authStyles.dividerLine} />
      </View>

      <View style={authStyles.socialRow}>
        <TouchableOpacity style={authStyles.socialButton} accessibilityLabel="Continue with Google">
          <Image source={require("../../assets/icons/google.png")} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={authStyles.socialButton} accessibilityLabel="Continue with Apple">
          <Image source={require("../../assets/icons/apple.png")} style={{ width: 26, height: 26 }} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={authStyles.socialButton} accessibilityLabel="Continue with Facebook">
          <Image source={require("../../assets/icons/facebook.png")} style={{ width: 26, height: 26 }} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </>
  );
}
