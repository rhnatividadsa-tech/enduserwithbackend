import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <Pressable onPress={() => router.push('/' as any)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8 }, pressed && { opacity: 0.7 }]}>
            <Image source={require('../assets/logo_b.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.brandName}>BayaniHub</Text>
          </Pressable>
        </View>

        <View style={styles.navLinks}>
          <Pressable onPress={() => router.push('/' as any)}>
            <Text style={styles.navLink}>Home</Text>
          </Pressable>
          <Pressable>
            <Text style={[styles.navLink, styles.activeLink]}>About Us</Text>
          </Pressable>
        </View>

        <View style={styles.navRight}>
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.5 }]}>
            <Image source={require('../assets/icon-bell.png')} style={styles.navIcon} resizeMode="contain" />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.userProfile, pressed && { opacity: 0.5 }]}>
            <Image source={require('../assets/icon-user.png')} style={styles.navIcon} resizeMode="contain" />
          </Pressable>
        </View>
      </View>

      {/* PAGE BODY */}
      <ScrollView 
        style={styles.pageBody} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          
          <View style={styles.headerSection}>
            <Text style={styles.mainTitle}>About BayaniHub</Text>
            <Text style={styles.mainSubtitle}>Empowering individuals to be heroes in their communities.</Text>
          </View>

          {/* GRID ROW 1: Who We Are & Our Vision (Stacked for Mobile) */}
          <View style={styles.gridColumn}>
            <View style={[styles.infoCard, { borderTopColor: '#4273B8' }]}>
              <Text style={styles.cardHeader}>Who We Are</Text>
              <Text style={styles.cardText}>
                We are a dedicated community response network designed to bridge the gap between urgent needs and available resources. From the site to sites across the region, we ensure that help is directed exactly where it is needed most.
              </Text>
            </View>

            <View style={[styles.infoCard, { borderTopColor: '#4273B8' }]}>
              <Text style={styles.cardHeader}>Our Vision</Text>
              <Text style={styles.cardText}>
                We believe every individual has the power to be a hero. Our platform streamlines the process of giving, whether you are donating essential goods or providing professional medical and logistical support.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>How We Work</Text>

          {/* GRID ROW 2: How We Work Steps (Stacked for Mobile) */}
          <View style={styles.gridColumn}>
            <View style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
                <Text style={styles.stepTitle}>Professional Vetting</Text>
              </View>
              <Text style={styles.cardText}>
                To maintain the highest standards of safety and service, all our professional volunteers undergo a thorough vetting process.
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}><Text style={styles.boldText}>Medical:</Text> Verification of licenses for all on-site personnel.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}><Text style={styles.boldText}>Logistics:</Text> Confirmation of driver credentials and insurance.</Text>
                </View>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
                <Text style={styles.stepTitle}>Resource Management</Text>
              </View>
              <Text style={styles.cardText}>
                Our system actively tracks and manages needs to prevent bottlenecks and ensure maximum operational efficiency.
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Tracks site capacity in real-time.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Identifies High Need areas immediately.</Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Prevents over-saturation at specific sites.</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Pressable 
              style={({ pressed }) => [styles.returnButton, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]} 
              onPress={() => router.push('/' as any)}
            >
              <Text style={styles.returnButtonText}>Return to Dashboard</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  
  // NAVBAR
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 90, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingTop: 35 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 18, fontWeight: 'normal', color: '#111827' },
  navLinks: { flexDirection: 'row', gap: 15 },
  navLink: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  activeLink: { color: '#4273B8' },
  logoImage: { width: 35, height: 35 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { padding: 5 },
  navIcon: { width: 24, height: 24, opacity: 0.7 },
  userProfile: { flexDirection: 'row', alignItems: 'center' },

  // BODY
  pageBody: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 15 },
  contentWrapper: { width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column' },
  
  headerSection: { alignItems: 'center', marginBottom: 30 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  mainSubtitle: { fontSize: 15, color: '#6B7280', marginTop: 10, textAlign: 'center', paddingHorizontal: 10 },
  
  // FOR MOBILE, we use column instead of row
  gridColumn: { flexDirection: 'column', gap: 20, marginBottom: 25 },
  
  infoCard: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderTopWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  stepCard: { backgroundColor: '#FFFFFF', padding: 25, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  cardText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 15, alignSelf: 'flex-start' },
  divider: { height: 1, backgroundColor: '#E5E7EB', width: '100%', marginVertical: 20 },
  
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  stepBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepBadgeText: { color: '#4273B8', fontWeight: 'bold', fontSize: 14 },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  
  bulletList: { marginTop: 15, flexDirection: 'column', gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4273B8', marginTop: 8, marginRight: 10 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  boldText: { fontWeight: 'bold', color: '#111827' },
  
  cardFooter: { marginTop: 10, width: '100%' },
  returnButton: { backgroundColor: '#4273B8', paddingVertical: 16, borderRadius: 10, alignItems: 'center', width: '100%' },
  returnButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});