import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_BASE } from '../src/lib/api';
import { useAuth } from '../src/providers/auth-provider';

// --- INTERFACES ---
interface PledgeItem {
  qty: string;
  name: string;
  unit: string;
  condition: string;
}

interface Campaign {
  id: string;
  title: string;
  type: string;
}

export default function PledgeScreen() {
  const router = useRouter();

  // --- NEW: Read parameters from Expo Router ---
  const { fromVolunteer } = useLocalSearchParams();
  const cameFromVolunteer = fromVolunteer === 'true';
  const { token } = useAuth();

  // --- FORM STATES ---
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch(`${API_BASE}/forms/campaigns`);
        if (res.ok) {
          const json = await res.json();
          setCampaigns(json.data || []);
        }
      } catch (e) { console.error('Failed to fetch campaigns', e); }
    }
    fetchCampaigns();
  }, []);

  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState<boolean>(false);
  const [selectedSite, setSelectedSite] = useState<string>(''); // Holds Campaign ID

  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string>('Select Time Slot');

  const [openDropdown, setOpenDropdown] = useState<{ index: number, type: 'unit' | 'condition' } | null>(null);
  const UNITS = ["Pieces", "Boxes", "Packs", "Sacks", "Kg"];
  const CONDITIONS = ["New", "Like New", "Good", "Fair"];

  const [items, setItems] = useState<PledgeItem[]>([
    { qty: '', name: '', unit: 'Pieces', condition: 'Good' },
  ]);

  // --- VALIDATION & MODAL STATES ---
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState<boolean>(false);
  const [showSimpleSuccessModal, setShowSimpleSuccessModal] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  // --- DATA ARRAYS ---
  const selectedCampaignTitle = campaigns.find(c => c.id === selectedSite)?.title || "Select Site Location";

  const timeSlots: string[] = [
    "Morning (8:00 AM - 12:00 PM)", "Afternoon (1:00 PM - 5:00 PM)", "Evening (5:00 PM - 8:00 PM)"
  ];

  // --- HANDLERS ---
  const addItem = () => setItems([...items, { qty: '', name: '', unit: 'pieces', condition: 'good' }]);
  const removeItem = (indexToRemove: number) => setItems(items.filter((_, index) => index !== indexToRemove));
  const updateItem = (index: number, field: keyof PledgeItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // --- VALIDATION LOGIC ---
  const isSiteValid = selectedSite !== '';
  const isTimeValid = selectedTime !== 'Select Time Slot';
  const validItems = items.filter(item => item.qty.trim() !== '' && item.name.trim() !== '');
  const isItemsValid = validItems.length > 0;

  // Step 1: Submit the initial form
  const handleInitialSubmit = () => {
    if (isSiteValid && isTimeValid && isItemsValid) {
      setIsConfirmed(false);
      setShowModal(true);
      setShowErrors(false);
    } else {
      setShowErrors(true);
    }
  };

  // Step 2: Confirm the details 
  const handleFinalConfirm = async () => {
    if (isConfirmed) {
      setShowModal(false);
      try {
        const donationData = {
          campaign_id: selectedSite,
          time_slot: selectedTime,
          items: validItems,
          submitted_at: new Date().toISOString(),
        };

        const response = await fetch(`${API_BASE}/forms/donation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(donationData),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Donation data submitted:', result);

          if (cameFromVolunteer) {
            setShowSimpleSuccessModal(true);
          } else {
            setShowVolunteerModal(true);
          }
        } else {
          const error = await response.json();
          Alert.alert('Submission Error', error.message || 'Failed to submit donation');
        }
      } catch (error) {
        console.error('Error submitting donation data:', error);
        Alert.alert('Network Error', 'Failed to submit donation. Please check your connection and try again.');
      }
    }
  };

  // Step 3: Handle the Volunteer Choice 
  const handleVolunteerChoice = (choice: 'yes' | 'no') => {
    setShowVolunteerModal(false);
    if (choice === 'yes') {
      router.push({ pathname: '/volunteer', params: { fromPledge: 'true' } } as any);
    } else {
      router.push('/' as any);
    }
  };

  return (
    <View style={styles.container}>

      {/* ========================================================= */}
      {/* MODAL 1: PLEDGE CONFIRMATION                              */}
      {/* ========================================================= */}
      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Your Pledge</Text>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Location:</Text>
              <Text style={styles.summaryValue}>{selectedCampaignTitle}</Text>

              <Text style={styles.summaryLabel}>Time Slot:</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>

              <Text style={styles.summaryLabel}>Items to Donate:</Text>
              {validItems.map((item, idx) => (
                <Text key={idx} style={styles.summaryValue}>• {item.qty} x {item.name}</Text>
              ))}
            </View>

            <Pressable style={styles.checkboxRowModal} onPress={() => setIsConfirmed(!isConfirmed)}>
              <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
                {isConfirmed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>I confirm that all details provided are correct.</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.confirmBtn, !isConfirmed && styles.confirmBtnDisabled, pressed && isConfirmed && { transform: [{ scale: 0.98 }] }]}
                onPress={handleFinalConfirm}
                disabled={!isConfirmed}
              >
                <Text style={styles.confirmBtnText}>Confirm Donation</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: VOLUNTEER PROMPT                                 */}
      {/* ========================================================= */}
      {showVolunteerModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 30 }]}>
            <View style={styles.checkmarkIconCircle}>
              <Text style={styles.checkmarkIconText}>✓</Text>
            </View>
            <Text style={styles.modalTitle}>Pledge Confirmed!</Text>
            <Text style={{ textAlign: 'center', fontSize: 16, color: '#444', marginBottom: 30, lineHeight: 22 }}>
              Thank you for your generous donation. Would you also like to volunteer your time to help with the relief efforts?
            </Text>

            <View style={{ flexDirection: 'row', gap: 15, width: '100%' }}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, { flex: 1 }, pressed && { opacity: 0.8 }]}
                onPress={() => handleVolunteerChoice('no')}
              >
                <Text style={styles.cancelBtnText}>No</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.confirmBtn, { flex: 1.5, backgroundColor: '#4273B8' }, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={() => handleVolunteerChoice('yes')}
              >
                <Text style={styles.confirmBtnText}>Yes, view roles</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SIMPLE SUCCESS MODAL                               */}
      {/* ========================================================= */}
      {showSimpleSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 40 }]}>
            <View style={styles.checkmarkIconCircle}><Text style={styles.checkmarkIconText}>✓</Text></View>
            <Text style={styles.modalTitle}>Pledge Confirmed!</Text>
            <Text style={{ textAlign: 'center', fontSize: 15, color: '#4B5563', marginBottom: 30, lineHeight: 24 }}>
              Thank you so much for your donation, and thank you again for volunteering! Your dedication makes a huge difference.
            </Text>
            {/* FIXED: Removed inherited flex: 2 so the text renders perfectly */}
            <Pressable
              style={({ pressed }) => [{ paddingVertical: 16, backgroundColor: '#4273B8', borderRadius: 12, alignItems: 'center', width: '100%' }, pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={() => router.push('/' as any)}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Return to Homepage</Text>
            </Pressable>
          </View>
        </View>
      )}
      {/* NAVIGATION BAR */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          <Pressable onPress={() => router.push('/' as any)} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8 }, pressed && { opacity: 0.7 }]}>
            <Image source={require('../assets/logo_b.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.brandName}>BayaniHub</Text>
          </Pressable>
        </View>

        <View style={styles.navLinks}>
          <Pressable onPress={() => router.push('/' as any)}><Text style={styles.navLink}>Home</Text></Pressable>
          <Pressable onPress={() => router.push('/about' as any)}><Text style={styles.navLink}>About Us</Text></Pressable>
        </View>

        <View style={styles.navRight}>
          <Pressable style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.7 }]}>
            <Image source={require('../assets/icon-bell.png')} style={styles.navIcon} resizeMode="contain" />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.userProfile, pressed && { opacity: 0.7 }]}>
            <Image source={require('../assets/icon-user.png')} style={styles.navIcon} resizeMode="contain" />
          </Pressable>
        </View>
      </View>

      {/* PAGE BODY */}
      <View style={styles.pageBody}>
        {/* CLEAN WHITE CONTENT CARD */}
        <View style={styles.contentWrapper}>

          <View style={styles.headerBannerGreen}>
            <Text style={styles.bannerText}>Pledge Donation</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            {/* 1. LOCATION & TIME */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Select Site Location</Text>
              <Pressable
                style={({ pressed }) => [styles.pickerBox, showErrors && !isSiteValid && styles.errorBorder, pressed && { opacity: 0.8 }]}
                onPress={() => { setIsSiteDropdownOpen(!isSiteDropdownOpen); setIsTimeDropdownOpen(false); }}
              >
                <Text style={[styles.pickerText, !isSiteValid && { color: '#888' }]}>"{selectedCampaignTitle}"</Text>
                <Text style={styles.pickerArrow}>∨</Text>
              </Pressable>
              {showErrors && !isSiteValid && <Text style={styles.errorText}>● Site Location is required.</Text>}

              {isSiteDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {campaigns.map((campaign, index) => (
                    <Pressable key={index} style={styles.dropdownItem} onPress={() => { setSelectedSite(campaign.id); setIsSiteDropdownOpen(false); }}>
                      <Text style={styles.dropdownItemText}>{campaign.title}</Text>
                    </Pressable>
                  ))}
                  {campaigns.length === 0 && (
                    <View style={styles.dropdownItem}><Text style={styles.dropdownItemText}>No active campaigns.</Text></View>
                  )}
                </View>
              )}

              <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Select Time Slot</Text>
              <Pressable
                style={({ pressed }) => [styles.pickerBox, showErrors && !isTimeValid && styles.errorBorder, pressed && { opacity: 0.8 }]}
                onPress={() => { setIsTimeDropdownOpen(!isTimeDropdownOpen); setIsSiteDropdownOpen(false); }}
              >
                <Text style={[styles.pickerText, !isTimeValid && { color: '#888' }]}>"{selectedTime}"</Text>
                <Text style={styles.pickerArrow}>∨</Text>
              </Pressable>
              {showErrors && !isTimeValid && <Text style={styles.errorText}>● Time Slot is required.</Text>}

              {isTimeDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {timeSlots.map((time, index) => (
                    <Pressable key={index} style={styles.dropdownItem} onPress={() => { setSelectedTime(time); setIsTimeDropdownOpen(false); }}>
                      <Text style={styles.dropdownItemText}>{time}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* 2. ITEMS TO DONATE */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Input Donation Item Details</Text>

              <View style={styles.itemsOuterList}>
                {items.map((item, index) => {
                  const showInputError = showErrors && !isItemsValid && item.qty === '' && item.name === '';
                  return (
                    <View key={index} style={[styles.itemCardOuter, { zIndex: items.length - index }]}>
                      <View style={styles.itemCardHeaderRow}>
                        <Text style={styles.itemCardCount}>Item #{index + 1}</Text>
                        <Pressable style={({ pressed }) => [styles.removeTextBtn, pressed && { opacity: 0.6 }]} onPress={() => removeItem(index)}>
                          <Text style={styles.removeTextBtnLabel}>Remove</Text>
                        </Pressable>
                      </View>

                      <View style={styles.itemInputGroup}>
                        <Text style={styles.miniLabel}>Item Name</Text>
                        <TextInput
                          style={[styles.fullBox, showInputError && styles.errorBorder]}
                          value={item.name} onChangeText={(text) => updateItem(index, 'name', text)}
                          placeholder="e.g., Canned Goods, Bottled Water"
                        />
                      </View>

                      <View style={styles.threeColRow}>
                        <View style={styles.flexOneCol}>
                          <Text style={styles.miniLabel}>Qty.</Text>
                          <TextInput
                            style={[styles.fullBox, showInputError && styles.errorBorder, { textAlign: 'center' }]}
                            value={item.qty} onChangeText={(text) => updateItem(index, 'qty', text)}
                            placeholder="0" keyboardType="numeric"
                          />
                        </View>

                        <View style={[styles.flexOneCol, { zIndex: openDropdown?.index === index && openDropdown?.type === 'unit' ? 10 : 1 }]}>
                          <Text style={styles.miniLabel}>Unit</Text>
                          <Pressable
                            style={styles.microPicker}
                            onPress={() => setOpenDropdown(openDropdown?.index === index && openDropdown?.type === 'unit' ? null : { index, type: 'unit' })}
                          >
                            <Text style={styles.microPickerText}>{item.unit}</Text>
                            <Text style={styles.pickerArrow}>∨</Text>
                          </Pressable>
                          {openDropdown?.index === index && openDropdown?.type === 'unit' && (
                            <View style={styles.microDropdown}>
                              {UNITS.map(u => (
                                <Pressable key={u} style={styles.microDropdownItem} onPress={() => { updateItem(index, 'unit', u); setOpenDropdown(null); }}>
                                  <Text style={styles.microDropdownText}>{u}</Text>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>

                        <View style={[styles.flexOneCol, { zIndex: openDropdown?.index === index && openDropdown?.type === 'condition' ? 10 : 1 }]}>
                          <Text style={styles.miniLabel}>Condition</Text>
                          <Pressable
                            style={styles.microPicker}
                            onPress={() => setOpenDropdown(openDropdown?.index === index && openDropdown?.type === 'condition' ? null : { index, type: 'condition' })}
                          >
                            <Text style={styles.microPickerText}>{item.condition}</Text>
                            <Text style={styles.pickerArrow}>∨</Text>
                          </Pressable>
                          {openDropdown?.index === index && openDropdown?.type === 'condition' && (
                            <View style={styles.microDropdown}>
                              {CONDITIONS.map(c => (
                                <Pressable key={c} style={styles.microDropdownItem} onPress={() => { updateItem(index, 'condition', c); setOpenDropdown(null); }}>
                                  <Text style={styles.microDropdownText}>{c}</Text>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              {showErrors && !isItemsValid && <Text style={styles.errorText}>● At least one valid item is required.</Text>}

              <Pressable style={({ pressed }) => [styles.addItemBtn, pressed && { opacity: 0.8 }]} onPress={addItem}>
                <Text style={styles.addItemBtnText}>+ ADD ANOTHER ITEM</Text>
              </Pressable>
            </View>

            {/* SUBMIT BUTTON */}
            {showErrors && (!isSiteValid || !isTimeValid || !isItemsValid) && (
              <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 10 }]}>
                ● Please address all required fields highlighted above.
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [styles.submitPledgeBtn, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
              onPress={handleInitialSubmit}
            >
              <Text style={styles.submitBtnText}>Submit Pledge Donation</Text>
            </Pressable>

          </ScrollView>
        </View>
      </View>
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
  logoImage: { width: 35, height: 35 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { padding: 5 },
  navIcon: { width: 24, height: 24, opacity: 0.7 },
  userProfile: { flexDirection: 'row', alignItems: 'center' },

  // CLEANED UP BODY (No Image)
  pageBody: { flex: 1, minHeight: height - 90, backgroundColor: '#F9FAFB', alignItems: 'center', paddingVertical: 20 },
  contentWrapper: { width: '95%', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, flex: 1 },

  headerBannerGreen: { backgroundColor: '#2D8A61', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 20 },
  bannerText: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },

  // FORMS
  section: { marginBottom: 30 },
  fieldLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#111' },
  errorBorder: { borderColor: '#E53E3E', borderWidth: 1, backgroundColor: '#FFF5F5' },
  errorText: { color: '#E53E3E', fontSize: 12, marginTop: 4, fontWeight: 'bold' },

  pickerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB' },
  pickerText: { fontSize: 14, color: '#111' },
  pickerArrow: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  dropdownMenu: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#CCC', marginTop: 5 },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  dropdownItemText: { fontSize: 14, color: '#333' },

  // ITEMS
  itemsOuterList: { gap: 15 },
  itemCardOuter: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 15 },
  itemCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 },
  itemCardCount: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' },
  removeTextBtn: { paddingVertical: 5, paddingHorizontal: 12, backgroundColor: '#FEF2F2', borderRadius: 6, borderWidth: 1, borderColor: '#FECACA' },
  removeTextBtnLabel: { color: '#DC2626', fontSize: 12, fontWeight: 'bold' },
  itemInputGroup: { marginBottom: 15, zIndex: 1 },
  miniLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  fullBox: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', height: 45 },
  threeColRow: { flexDirection: 'row', gap: 10 },
  flexOneCol: { flex: 1 },
  microPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 0, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', height: 45 },
  microPickerText: { fontSize: 13, color: '#111827' },
  microDropdown: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  microDropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  microDropdownText: { fontSize: 13, color: '#374151' },
  addItemBtn: { alignSelf: 'center', marginTop: 15, backgroundColor: '#F0FDF4', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#86EFAC' },
  addItemBtnText: { fontSize: 13, fontWeight: 'bold', color: '#166534' },

  // SUBMIT
  submitPledgeBtn: { backgroundColor: '#2D8A61', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  // MODALS
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25, width: '90%', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 20, textAlign: 'center' },
  summaryBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  summaryLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginTop: 10, marginBottom: 4 },
  summaryValue: { fontSize: 15, color: '#0F172A', fontWeight: '500' },

  checkboxRowModal: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#2D8A61', borderRadius: 6, marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  checkboxChecked: { backgroundColor: '#2D8A61' },
  checkmark: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  checkboxText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 20 },

  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontSize: 16, fontWeight: 'bold' },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2D8A61', alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#94A3B8' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  checkmarkIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', borderWidth: 3, borderColor: '#2D8A61',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  checkmarkIconText: { color: '#2D8A61', fontSize: 40, fontWeight: 'bold', marginTop: -3 },
});