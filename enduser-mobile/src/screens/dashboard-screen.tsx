import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from "@/src/providers/auth-provider";

export function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Protect the route - only allow logged in users
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      
      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <Pressable onPress={() => router.push('/' as any)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8 }, pressed && { opacity: 0.7 }]}>
            <Image source={require('../../assets/logo_b.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.brandName}>BayaniHub</Text>
          </Pressable>
        </View>

        {/* Nav Links */}
        <View style={styles.navLinks}>
          <Pressable onPress={() => router.push('/' as any)}><Text style={styles.navLink}>Home</Text></Pressable>
          <Pressable onPress={() => router.push('/about' as any)}><Text style={styles.navLink}>About Us</Text></Pressable>
        </View>

        <View style={styles.navRight}>
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]} onPress={handleLogout}>
            <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: 'bold' }}>Logout</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.userProfile, pressed && { opacity: 0.5 }]}>
            <Image source={require('../../assets/icon-user.png')} style={styles.navIcon} resizeMode="contain" />
          </Pressable>
        </View>
      </View>

      {/* PAGE BODY */}
      <View style={styles.pageBody}>
        <Image source={require('../../assets/hero-bg.png')} style={styles.heroBg} resizeMode="cover" />
        <View style={styles.heroOverlay} />

        <View style={styles.contentWrapper}>
          
          <View style={styles.heroSection}>
            <Text style={styles.welcomeText}>
              Welcome To <Text style={styles.brandText}>BayaniHub</Text>
            </Text>
            <Text style={styles.headlineText}>
              Right People.{'\n'}Right Resources.{'\n'}Right Now.
            </Text>
            <Text style={styles.subHeadlineText}>
              BayaniHub is a unified platform managing both volunteers and material aid.
            </Text>
          </View>

          <View style={styles.cardsContainer}>
            
            {/* PLEDGE CARD */}
            <Pressable 
              style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]} 
              onPress={() => router.push('/pledge' as any)} 
            >
              <View style={styles.cardTop}>
                <Image source={require('../../assets/icon-box.png')} style={styles.cardIconImage} resizeMode="contain" />
                <Text style={styles.cardTitle}>Pledge Goods</Text>
                <Text style={styles.cardSubtitle}>Review dynamic site needs. Donate supplies.</Text>
              </View>
              <View style={[styles.cardButton, { backgroundColor: '#2E8B57' }]}>
                <Text style={styles.cardButtonText}>Pledge Now</Text>
              </View>
            </Pressable>

            {/* VOLUNTEER CARD */}
            <Pressable 
              style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]} 
              onPress={() => router.push('/volunteer' as any)} 
            >
              <View style={styles.cardTop}>
                <Image source={require('../../assets/icon-handshake.png')} style={styles.cardIconImage} resizeMode="contain" />
                <Text style={styles.cardTitle}>Volunteer Force</Text>
                <Text style={styles.cardSubtitle}>Discover Medic, Logistics, & Field roles.</Text>
              </View>
              <View style={[styles.cardButton, { backgroundColor: '#3B71CA' }]}>
                <Text style={styles.cardButtonText}>Volunteer Now</Text>
              </View>
            </Pressable>
            
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const { height } = Dimensions.get('window'); 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 90, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10, paddingTop: 35, 
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 18, fontWeight: 'normal', color: '#111827' },
  navLinks: { flexDirection: 'row', gap: 15 },
  navLink: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  logoImage: { width: 35, height: 35 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { padding: 5 },
  navIcon: { width: 24, height: 24, opacity: 0.7 },
  userProfile: { flexDirection: 'row', alignItems: 'center' },

  pageBody: {
    flex: 1, minHeight: height - 90, position: 'relative',
    alignItems: 'center', paddingVertical: 30,
  },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0F172A', opacity: 0.75 },
  
  contentWrapper: { width: '90%', zIndex: 2, alignItems: 'center' },

  heroSection: { alignItems: 'center', marginBottom: 40 },
  welcomeText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 },
  brandText: { color: '#60A5FA' },
  headlineText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 15, lineHeight: 40 },
  subHeadlineText: { fontSize: 16, color: '#E5E7EB', textAlign: 'center', lineHeight: 24 },

  cardsContainer: { flexDirection: 'column', gap: 25, width: '100%' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25, width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, 
  },
  cardTop: { alignItems: 'center', marginBottom: 20 },
  cardIconImage: { width: 50, height: 50, marginBottom: 15 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20 },
  
  cardButton: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cardButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
