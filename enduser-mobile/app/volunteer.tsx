import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE } from '../src/lib/api';
import { useAuth } from '../src/providers/auth-provider';

// --- INTERFACES ---
interface Item {
  qty: string;
  name: string;
}

interface Checkboxes {
  background: boolean;
  documents: boolean;
  age: boolean;
}

interface ConductChecks {
  conduct: boolean;
  confidential: boolean;
  safety: boolean;
}

export default function VolunteerScreen() {
  const router = useRouter();
  const { token } = useAuth(); // NEW: Grab active session

  // --- NEW: Read parameters from Expo Router ---
  const { fromPledge } = useLocalSearchParams();
  const cameFromPledge = fromPledge === 'true';

  // --- STEP STATE ---
  const [step, setStep] = useState<number>(1); 

  // --- FORM STATES (Step 2) ---
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState<boolean>(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string>('Select Time Slot');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedDocument({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
        setCheckboxes(prev => ({ ...prev, documents: true }));
      }
    } catch (err) {
      console.error('File pick error', err);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/forms/campaigns/volunteer`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaigns(data.data);
        }
      })
      .catch(console.error);
  }, []);

  const selectedCampaignTitle = campaigns.find(c => c.id === selectedCampaignId)?.title || 'Select Site Location';

  const [checkboxes, setCheckboxes] = useState<Checkboxes>({
    background: false,
    documents: false,
    age: false,
  });

  // --- FORM STATES (Step 3: Questionnaire) ---
  const [qDisaster, setQDisaster] = useState<boolean | null>(null);
  const [qRugged, setQRugged] = useState<boolean | null>(null);
  const [qMedical, setQMedical] = useState<boolean | null>(null);
  const [qVaccines, setQVaccines] = useState<boolean | null>(null);
  const [qLift, setQLift] = useState<boolean | null>(null);
  const [qTransport, setQTransport] = useState<boolean | null>(null);
  const [transportMode, setTransportMode] = useState<string>('');
  
  const [conductChecks, setConductChecks] = useState<ConductChecks>({
    conduct: false,
    confidential: false,
    safety: false,
  });

  const [showErrors, setShowErrors] = useState<boolean>(false);

  // --- DATA ---
  const timeSlots: string[] = [
    "Morning (8:00 AM - 12:00 PM)", "Afternoon (1:00 PM - 5:00 PM)", "Evening (5:00 PM - 8:00 PM)"
  ];

  // --- AUTO-CHECK LOGIC FOR FIELD ROLE ---
  useEffect(() => {
    if (selectedRole === 'field') {
      setCheckboxes(prev => ({ ...prev, documents: true }));
    }
  }, [selectedRole]);

  // --- HANDLERS ---
  const toggleCheckbox = (key: keyof Checkboxes) => {
    setCheckboxes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleConductCheck = (key: keyof ConductChecks) => {
    setConductChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- VALIDATION LOGIC ---
  const isSiteValid = selectedCampaignId !== '';
  const isTimeValid = selectedTime !== 'Select Time Slot';
  const isRoleValid = selectedRole !== null;
  const isCheckboxesValid = checkboxes.background && checkboxes.documents && checkboxes.age;

  const handleNextToStep3 = () => {
    if (isSiteValid && isTimeValid && isRoleValid && isCheckboxesValid) {
      setShowErrors(false);
      setStep(3);
    } else {
      setShowErrors(true);
    }
  };

  const isStep3Valid = 
    qDisaster !== null && qRugged !== null && qMedical !== null && 
    qVaccines !== null && qLift !== null && qTransport !== null && 
    transportMode.trim() !== '' && 
    conductChecks.conduct && conductChecks.confidential && conductChecks.safety;

  const handleSubmitFinal = async () => {
    if (isStep3Valid) {
      setShowErrors(false);
      try {
        const formData = new FormData();
        formData.append("campaign_id", selectedCampaignId);
        formData.append("time_slot", selectedTime);
        formData.append("role", selectedRole!);
        formData.append("background_check_agreed", String(checkboxes.background));
        formData.append("documents_agreed", String(checkboxes.documents));
        formData.append("age_verified", String(checkboxes.age));
        formData.append("disaster_experience", String(qDisaster));
        formData.append("rugged_environment", String(qRugged));
        formData.append("medical_conditions", String(qMedical));
        formData.append("vaccinations_current", String(qVaccines));
        formData.append("can_lift_25lbs", String(qLift));
        formData.append("has_transportation", String(qTransport));
        formData.append("transportation_mode", transportMode);
        formData.append("conduct_agreed", String(conductChecks.conduct));
        formData.append("confidentiality_agreed", String(conductChecks.confidential));
        formData.append("safety_agreed", String(conductChecks.safety));

        if (selectedDocument) {
          formData.append("resume", {
            uri: selectedDocument.uri,
            name: selectedDocument.name,
            type: selectedDocument.type,
          } as any);
        }
        
        const response = await fetch(`${API_BASE}/forms/volunteer`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Volunteer data submitted:', result);
          setStep(4);
        } else {
          const error = await response.json();
          Alert.alert('Submission Error', error.message || 'Failed to submit volunteer application');
        }
      } catch (error) {
        console.error('Error submitting volunteer data:', error);
        Alert.alert('Network Error', 'Failed to submit application. Please check your connection and try again.');
      }
    } else {
      setShowErrors(true);
    }
  };

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
          <View style={styles.headerBanner}>
            <Text style={styles.bannerText}>Volunteer Registration</Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
            
            {/* ========================================================= */}
            {/* STEP 1: READING                                           */}
            {/* ========================================================= */}
            {step === 1 && (
              <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <View style={[styles.cardOutline, { width: '100%', marginBottom: 20 }]}>
                  <Text style={styles.cardTitle}>Registration Status</Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBar, styles.progressActive]} />
                    <View style={styles.progressBar} />
                    <View style={styles.progressBar} />
                    <View style={styles.progressBar} />
                  </View>
                  <Text style={[styles.progressLabel, styles.labelActive, {marginTop: 5}]}>[1] Role Selection & Reading (Current)</Text>
                </View>

                <View style={[styles.cardOutline, { width: '100%', marginBottom: 25 }]}>
                  <Text style={styles.cardTitle}>Detailed Role Requirements</Text>
                  <Text style={styles.subTitle}>1. Common Requirements</Text>
                  <Text style={styles.descText}>General Screening and on-site briefing are mandatory before your first shift.</Text>
                  <View style={styles.bulletList}>
                    <Text style={styles.bulletItem}>• Complete online General Screening</Text>
                    <Text style={styles.bulletItem}>• Mandatory on-site volunteer briefing</Text>
                  </View>

                  <Text style={[styles.subTitle, { marginTop: 25 }]}>2. Specific Role Requirements</Text>
                  <View style={styles.roleList}>
                    <View style={styles.roleRow}>
                      <View style={styles.roleIconBox}><Image source={require('../assets/medic_logo.png')} style={styles.roleIcon} resizeMode="contain" /><Text style={styles.roleIconLabel}>Medic</Text></View>
                      <View style={styles.roleTextContent}><Text style={styles.roleName}>Medic</Text><Text style={styles.descText}>Provide primary medical care. Valid Medical or Nursing License (mandatory).</Text></View>
                    </View>
                    <View style={styles.roleRow}>
                      <View style={styles.roleIconBox}><Image source={require('../assets/logistics_logo.png')} style={styles.roleIcon} resizeMode="contain" /><Text style={styles.roleIconLabel}>Logistics</Text></View>
                      <View style={styles.roleTextContent}><Text style={styles.roleName}>Logistics</Text><Text style={styles.descText}>Manage supply distribution. Valid Professional Driver's License.</Text></View>
                    </View>
                    <View style={styles.roleRow}>
                      <View style={styles.roleIconBox}><Image source={require('../assets/field_logo.png')} style={styles.roleIcon} resizeMode="contain" /><Text style={styles.roleIconLabel}>Field</Text></View>
                      <View style={styles.roleTextContent}><Text style={styles.roleName}>Field</Text><Text style={styles.descText}>Manage crowd flow and outreach. Strong communication skills.</Text></View>
                    </View>
                  </View>
                </View>

                <Pressable style={({ pressed }) => [styles.doneBtn, pressed && styles.btnPress]} onPress={() => setStep(2)}>
                  <Text style={styles.doneBtnText}>Done Reading</Text>
                </Pressable>
              </View>
            )}

            {/* ========================================================= */}
            {/* STEP 2: FORM                                              */}
            {/* ========================================================= */}
            {step === 2 && (
              <View style={styles.mainGridMobile}>
                <View style={styles.cardOutline}>
                  <Text style={styles.cardTitle}>Registration Status</Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBar, styles.progressCompleted]} />
                    <View style={[styles.progressBar, styles.progressActive]} />
                    <View style={styles.progressBar} />
                    <View style={styles.progressBar} />
                  </View>
                  <Text style={[styles.progressLabel, styles.labelActive, {marginTop: 5}]}>[2] Document Upload (Current)</Text>
                </View>

                <View style={styles.cardOutline}>
                  <Text style={styles.fieldLabel}>Select Site Location</Text>
                  <Pressable style={[styles.pickerBox, showErrors && !isSiteValid && styles.errorBorder]} onPress={() => { setIsSiteDropdownOpen(!isSiteDropdownOpen); setIsTimeDropdownOpen(false); }}>
                    <Text style={[styles.pickerText, !isSiteValid && {color: '#888'}]}>"{selectedCampaignTitle}"</Text>
                    <Text style={styles.pickerArrow}>∨</Text>
                  </Pressable>
                  
                  {isSiteDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {campaigns.length === 0 ? (
                        <Text style={[styles.dropdownItemText, { padding: 12, color: '#888', fontStyle: 'italic' }]}>No active volunteer campaigns.</Text>
                      ) : (
                        campaigns.map((camp) => (
                          <Pressable key={camp.id} style={styles.dropdownItem} onPress={() => { setSelectedCampaignId(camp.id); setIsSiteDropdownOpen(false); }}>
                            <Text style={styles.dropdownItemText}>{camp.title}</Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  )}

                  <Text style={[styles.fieldLabel, {marginTop: 20}]}>Select Time Slot</Text>
                  <Pressable style={[styles.pickerBox, showErrors && !isTimeValid && styles.errorBorder]} onPress={() => { setIsTimeDropdownOpen(!isTimeDropdownOpen); setIsSiteDropdownOpen(false); }}>
                    <Text style={[styles.pickerText, !isTimeValid && {color: '#888'}]}>"{selectedTime}"</Text>
                    <Text style={styles.pickerArrow}>∨</Text>
                  </Pressable>
                  
                  {isTimeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {timeSlots.map((time, index) => (
                        <Pressable key={index} style={styles.dropdownItem} onPress={() => { setSelectedTime(time); setIsTimeDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{time}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <Text style={[styles.fieldLabel, {marginTop: 25}]}>Select Your Role</Text>
                  <View style={styles.roleSelectionRow}>
                    <Pressable style={[styles.roleSelectCard, selectedRole === 'medic' && styles.roleSelectActive]} onPress={() => setSelectedRole('medic')}>
                      <Image source={require('../assets/medic_logo.png')} style={styles.roleSelectIcon} />
                      <Text style={[styles.roleSelectText, selectedRole === 'medic' && styles.roleSelectTextActive]}>Medic</Text>
                    </Pressable>
                    <Pressable style={[styles.roleSelectCard, selectedRole === 'logistics' && styles.roleSelectActive]} onPress={() => setSelectedRole('logistics')}>
                      <Image source={require('../assets/logistics_logo.png')} style={styles.roleSelectIcon} />
                      <Text style={[styles.roleSelectText, selectedRole === 'logistics' && styles.roleSelectTextActive]}>Logistics</Text>
                    </Pressable>
                    <Pressable style={[styles.roleSelectCard, selectedRole === 'field' && styles.roleSelectActive]} onPress={() => setSelectedRole('field')}>
                      <Image source={require('../assets/field_logo.png')} style={styles.roleSelectIcon} />
                      <Text style={[styles.roleSelectText, selectedRole === 'field' && styles.roleSelectTextActive]}>Field</Text>
                    </Pressable>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 15 }]}>Required Document:</Text>
                  <View style={styles.documentsContainer}>
                    {selectedRole === null && <Text style={{color: '#888', fontStyle: 'italic', fontSize: 13}}>Select a role above.</Text>}
                    {selectedRole === 'medic' && (
                      <View style={styles.uploadRow}>
                        <View style={styles.uploadInfo}><Text style={styles.docIcon}>📄</Text><Text style={styles.uploadText}>{selectedDocument ? selectedDocument.name : 'Medical License'}</Text></View>
                        <Pressable style={styles.uploadBtn} onPress={handleFileUpload}><Text style={styles.uploadBtnText}>{selectedDocument ? 'Change' : 'Upload'}</Text></Pressable>
                      </View>
                    )}
                    {selectedRole === 'logistics' && (
                      <View style={styles.uploadRow}>
                        <View style={styles.uploadInfo}><Text style={styles.docIcon}>📄</Text><Text style={styles.uploadText}>{selectedDocument ? selectedDocument.name : "Driver's License"}</Text></View>
                        <Pressable style={styles.uploadBtn} onPress={handleFileUpload}><Text style={styles.uploadBtnText}>{selectedDocument ? 'Change' : 'Upload'}</Text></Pressable>
                      </View>
                    )}
                    {selectedRole === 'field' && (
                      <View style={[styles.uploadRow, { borderStyle: 'solid', borderColor: '#38A169', backgroundColor: '#F0FDF4' }]}>
                        <View style={styles.uploadInfo}><Text style={styles.docIcon}>✅</Text><Text style={[styles.uploadText, { color: '#2D8A61', fontWeight: 'bold' }]}>No documents required.</Text></View>
                      </View>
                    )}
                  </View>

                  <View style={styles.capacityRow}>
                    <Text style={styles.capacityLabel}>Real-Time Capacity:</Text>
                    <View style={styles.siteBadge}><Text style={styles.siteBadgeText}>{selectedCampaignId !== '' ? selectedCampaignTitle : ''}</Text></View>
                    <View style={[styles.badge, styles.badgeModerate, {marginLeft: 10}]}><Text style={styles.badgeText}>Moderate</Text></View>
                  </View>

                  <Text style={[styles.cardTitle, { fontSize: 18, marginTop: 25, marginBottom: 12 }]}>Vetting</Text>
                  <View style={styles.checkboxGroup}>
                    <Pressable onPress={() => toggleCheckbox('background')} style={styles.checkboxRow}>
                      <View style={[styles.checkboxSquare, checkboxes.background && styles.checkboxSquareActive]}>{checkboxes.background && <Text style={styles.checkmark}>✓</Text>}</View>
                      <Text style={styles.checkboxLabel}>I agree to a background check.</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleCheckbox('documents')} style={styles.checkboxRow}>
                      <View style={[styles.checkboxSquare, checkboxes.documents && styles.checkboxSquareActive]}>{checkboxes.documents && <Text style={styles.checkmark}>✓</Text>}</View>
                      <Text style={styles.checkboxLabel}>{selectedRole === 'field' ? 'I acknowledge requirements.' : 'I have uploaded documents.'}</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleCheckbox('age')} style={styles.checkboxRow}>
                      <View style={[styles.checkboxSquare, checkboxes.age && styles.checkboxSquareActive]}>{checkboxes.age && <Text style={styles.checkmark}>✓</Text>}</View>
                      <Text style={styles.checkboxLabel}>I am over 18 years old.</Text>
                    </Pressable>
                  </View>
                  
                  {showErrors && (!isSiteValid || !isTimeValid || !isRoleValid || !isCheckboxesValid) && (
                    <Text style={[styles.errorText, {marginTop: 15, textAlign: 'center'}]}>● Please address all required fields highlighted in red.</Text>
                  )}
                </View>

                <Pressable style={({pressed}) => [styles.nextStepBtn, pressed && styles.btnPress]} onPress={handleNextToStep3}>
                  <Text style={styles.nextStepBtnText}>Next: Screening ➔</Text>
                </Pressable>
              </View>
            )}

            {/* ========================================================= */}
            {/* STEP 3: QUESTIONNAIRE (ALIGNED & CLEANED)                 */}
            {/* ========================================================= */}
            {step === 3 && (
              <View style={styles.mainGridMobile}>
                <View style={styles.cardOutline}>
                  <Text style={styles.cardTitle}>Registration Status Tracker</Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBar, styles.progressCompleted]} />
                    <View style={[styles.progressBar, styles.progressCompleted]} />
                    <View style={[styles.progressBar, styles.progressActive]} />
                    <View style={styles.progressBar} />
                  </View>
                  <Text style={[styles.progressLabel, styles.labelActive, {marginTop: 5}]}>[3] General Screening Questionnaire (Current Step)</Text>
                </View>

                <View style={[styles.cardOutline, { paddingHorizontal: 0 }]}>
                  <Text style={[styles.cardTitle, { marginBottom: 20, paddingHorizontal: 20 }]}>Self-Assessment Questionnaire</Text>

                  {/* Basic Background (Wrapped to match inner padding) */}
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={styles.qSectionTitle}>Basic Background</Text>
                    <View style={styles.qQuestionRow}>
                      <Text style={styles.qQuestionText}>Have you previously volunteered in disaster response?</Text>
                      <View style={styles.pillToggle}>
                        <Pressable style={[styles.pillOption, qDisaster === true && styles.pillOptionActive]} onPress={() => setQDisaster(true)}><Text style={[styles.pillText, qDisaster === true && styles.pillTextActive]}>YES</Text></Pressable>
                        <Pressable style={[styles.pillOption, qDisaster === false && styles.pillOptionActive]} onPress={() => setQDisaster(false)}><Text style={[styles.pillText, qDisaster === false && styles.pillTextActive]}>NO</Text></Pressable>
                      </View>
                    </View>

                    <View style={styles.qQuestionRow}>
                      <Text style={styles.qQuestionText}>Are you comfortable working in rugged or stressful environments?</Text>
                      <View style={styles.pillToggle}>
                        <Pressable style={[styles.pillOption, qRugged === true && styles.pillOptionActive]} onPress={() => setQRugged(true)}><Text style={[styles.pillText, qRugged === true && styles.pillTextActive]}>YES</Text></Pressable>
                        <Pressable style={[styles.pillOption, qRugged === false && styles.pillOptionActive]} onPress={() => setQRugged(false)}><Text style={[styles.pillText, qRugged === false && styles.pillTextActive]}>NO</Text></Pressable>
                      </View>
                    </View>
                  </View>

                  {/* Health & Safety Self-Assessment */}
                  <View style={styles.healthBannerClean}>
                    <Text style={styles.qSectionTitle}>Health & Safety Self-Assessment</Text>
                    <Text style={styles.healthDesc}>This section helps us match you to appropriate roles. All responses are confidential.</Text>
                    
                    <View style={styles.qQuestionRow}>
                      <Text style={styles.qQuestionText}>Do you have any <Text style={{fontWeight: 'bold'}}>medical conditions requiring immediate attention or physical restrictions</Text>?</Text>
                      <View style={[styles.pillToggle, showErrors && qMedical === null && styles.errorBorder]}>
                        <Pressable style={[styles.pillOption, qMedical === true && styles.pillOptionActive]} onPress={() => setQMedical(true)}><Text style={[styles.pillText, qMedical === true && styles.pillTextActive]}>YES</Text></Pressable>
                        <Pressable style={[styles.pillOption, qMedical === false && styles.pillOptionActive]} onPress={() => setQMedical(false)}><Text style={[styles.pillText, qMedical === false && styles.pillTextActive]}>NO</Text></Pressable>
                      </View>
                    </View>

                    <View style={styles.qQuestionRow}>
                      <Text style={styles.qQuestionText}>Are you up-to-date on essential <Text style={{fontWeight: 'bold'}}>vaccinations</Text> (e.g., Flu)?</Text>
                      <View style={[styles.pillToggle, showErrors && qVaccines === null && styles.errorBorder]}>
                        <Pressable style={[styles.pillOption, qVaccines === true && styles.pillOptionActive]} onPress={() => setQVaccines(true)}><Text style={[styles.pillText, qVaccines === true && styles.pillTextActive]}>YES</Text></Pressable>
                        <Pressable style={[styles.pillOption, qVaccines === false && styles.pillOptionActive]} onPress={() => setQVaccines(false)}><Text style={[styles.pillText, qVaccines === false && styles.pillTextActive]}>NO</Text></Pressable>
                      </View>
                    </View>

                    <View style={styles.qQuestionRow}>
                      <Text style={styles.qQuestionText}>Are you physically able to lift and carry items up to 25 lbs (11 kg)?</Text>
                      <View style={[styles.pillToggle, showErrors && qLift === null && styles.errorBorder]}>
                        <Pressable style={[styles.pillOption, qLift === true && styles.pillOptionActive]} onPress={() => setQLift(true)}><Text style={[styles.pillText, qLift === true && styles.pillTextActive]}>YES</Text></Pressable>
                        <Pressable style={[styles.pillOption, qLift === false && styles.pillOptionActive]} onPress={() => setQLift(false)}><Text style={[styles.pillText, qLift === false && styles.pillTextActive]}>NO</Text></Pressable>
                      </View>
                    </View>
                  </View>

                  {/* Availability & Logistics (Wrapped to match inner padding) */}
                  <View style={{ paddingHorizontal: 20 }}>
                    <Text style={[styles.qSectionTitle, { marginTop: 5 }]}>Availability & Logistics</Text>
                    <View style={styles.qQuestionRow}>
                      <Text style={styles.qQuestionText}>Do you have <Text style={{fontWeight: 'bold'}}>personal transportation</Text> to a disaster site?</Text>
                      <View style={[styles.pillToggle, showErrors && qTransport === null && styles.errorBorder]}>
                        <Pressable style={[styles.pillOption, qTransport === true && styles.pillOptionActive]} onPress={() => setQTransport(true)}><Text style={[styles.pillText, qTransport === true && styles.pillTextActive]}>YES</Text></Pressable>
                        <Pressable style={[styles.pillOption, qTransport === false && styles.pillOptionActive]} onPress={() => setQTransport(false)}><Text style={[styles.pillText, qTransport === false && styles.pillTextActive]}>NO</Text></Pressable>
                      </View>
                    </View>
                    
                    <Text style={[styles.qQuestionText, {marginBottom: 8}]}>What is your typical mode of transportation? (Personal Vehicle, Public Transpo, etc.)</Text>
                    <TextInput 
                      style={[styles.transpoInput, showErrors && transportMode.trim() === '' && styles.errorBorder]}
                      placeholder='"Type of Transportation"' placeholderTextColor="#999"
                      value={transportMode} onChangeText={setTransportMode}
                    />

                    {/* Volunteer Conduct */}
                    <Text style={[styles.qSectionTitle, {marginTop: 25}]}>Volunteer Conduct & Confidentiality</Text>
                    <View style={styles.conductChecksContainer}>
                      <Pressable onPress={() => toggleConductCheck('conduct')} style={[styles.conductCheckCard, conductChecks.conduct && styles.conductCheckCardActive, showErrors && !conductChecks.conduct && styles.errorBorder]}>
                        <View style={[styles.conductCheckboxSquare, conductChecks.conduct && styles.conductCheckboxActive]}>{conductChecks.conduct && <Text style={styles.conductCheckmark}>✓</Text>}</View>
                        <Text style={styles.conductCheckLabel}>Do you agree to abide by the BayaniHub Volunteer Code of Conduct and treat aid recipients with dignity? (Mandatory)</Text>
                      </Pressable>
                      
                      <Pressable onPress={() => toggleConductCheck('confidential')} style={[styles.conductCheckCard, conductChecks.confidential && styles.conductCheckCardActive, showErrors && !conductChecks.confidential && styles.errorBorder]}>
                        <View style={[styles.conductCheckboxSquare, conductChecks.confidential && styles.conductCheckboxActive]}>{conductChecks.confidential && <Text style={styles.conductCheckmark}>✓</Text>}</View>
                        <Text style={styles.conductCheckLabel}>Do you agree to maintain the strict confidentiality of all private information you access? (Mandatory)</Text>
                      </Pressable>
                      
                      <Pressable onPress={() => toggleConductCheck('safety')} style={[styles.conductCheckCard, conductChecks.safety && styles.conductCheckCardActive, showErrors && !conductChecks.safety && styles.errorBorder]}>
                        <View style={[styles.conductCheckboxSquare, conductChecks.safety && styles.conductCheckboxActive]}>{conductChecks.safety && <Text style={styles.conductCheckmark}>✓</Text>}</View>
                        <Text style={styles.conductCheckLabel}>Do you understand and agree to follow all safety protocols and guidelines provided for each site? (Mandatory)</Text>
                      </Pressable>
                    </View>

                    <View style={{ marginTop: 25, flexDirection: 'column', gap: 10 }}>
                      <Text style={styles.warningText}>Your contribution is valuable. Please complete all fields.</Text>
                      {showErrors && !isStep3Valid && <Text style={[styles.errorText, {marginBottom: 10}]}>● Please address the missing fields above.</Text>}
                      
                      <View style={styles.step3ActionRow}>
                        <Pressable style={({pressed}) => [styles.backBtnStep3, pressed && styles.btnPress]} onPress={() => setStep(2)}>
                          <Text style={styles.backBtnTextStep3}>Back</Text>
                        </Pressable>
                        <Pressable style={({pressed}) => [styles.submitBtnStep3, pressed && styles.btnPress]} onPress={handleSubmitFinal}>
                          <Text style={styles.submitBtnTextStep3}>Submit Assessment</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>

                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* STEP 4: SUCCESS WITH DONOR PROMPT                         */}
            {/* ========================================================= */}
            {step === 4 && (
              <View style={styles.step4Container}>
                <View style={styles.successCard}>
                  <View style={styles.successHeaderRow}><Text style={styles.successHeaderText}>Success!</Text></View>
                  <View style={styles.successBody}>
                    
                    <View style={styles.checkmarkIconCircle}>
                      <Text style={styles.checkmarkIconText}>✓</Text>
                    </View>

                    <Text style={styles.thankYouTitle}>Application Received</Text>
                    <Text style={styles.successDescText}>Your profile is now under review by the BayaniHub Admin Team.</Text>
                    
                    <Text style={styles.successDetailText}>
                      <Text style={{fontWeight: 'bold'}}>Summary:</Text> {selectedRole ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1) : ''} Role ({selectedTime})
                    </Text>

                    {/* CROSS-SELL DONOR PROMPT */}
                    {!cameFromPledge ? (
                      <View style={{ marginTop: 40, width: '100%', alignItems: 'center', borderTopWidth: 1, borderColor: '#EEE', paddingTop: 25 }}>
                        <Text style={styles.donorPromptText}>Do you want to be a Donor?</Text>
                        <View style={{ flexDirection: 'column', gap: 12, width: '100%', marginTop: 20 }}>
                          <Pressable 
                            style={({pressed}) => [styles.yesDonorBtn, pressed && styles.btnPress]} 
                            onPress={() => router.push({ pathname: '/pledge', params: { fromVolunteer: 'true' } } as any)}
                          >
                            <Text style={styles.yesDonorBtnText}>Yes, I want to be a donor</Text>
                          </Pressable>
                          
                          <Pressable 
                            style={({pressed}) => [styles.noDonorBtn, pressed && styles.btnPress]} 
                            onPress={() => router.push('/' as any)}
                          >
                            <Text style={styles.noDonorBtnText}>No, Return to Homepage</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      // If they came from Pledge, skip the prompt and just show a return button
                      <View style={{ marginTop: 20, width: '100%', alignItems: 'center', paddingTop: 25 }}>
                        <Pressable 
                          style={({pressed}) => [styles.doneBtn, pressed && styles.btnPress]} 
                          onPress={() => router.push('/')}
                        >
                          <Text style={styles.doneBtnText}>Return to Homepage</Text>
                        </Pressable>
                      </View>
                    )}

                  </View>
                </View>
              </View>
            )}

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
  
  headerBanner: { backgroundColor: '#4273B8', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 15 },
  bannerText: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },

  mainGridMobile: { flexDirection: 'column', gap: 15, flex: 1 },
  btnPress: { transform: [{ scale: 0.98 }], opacity: 0.8 },
  doneBtn: { backgroundColor: '#4273B8', paddingVertical: 16, borderRadius: 12, alignItems: 'center', width: '100%', marginTop: 10 },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  nextStepBtn: { backgroundColor: '#4273B8', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  nextStepBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  cardOutline: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
  progressActive: { backgroundColor: '#4273B8' },
  progressCompleted: { backgroundColor: '#4273B8' },
  progressLabel: { fontSize: 11, color: '#888' },
  labelActive: { color: '#111', fontWeight: 'bold' },

  subTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 5 },
  descText: { fontSize: 13, color: '#444', lineHeight: 18 },
  bulletList: { paddingLeft: 10, marginTop: 5 },
  bulletItem: { fontSize: 13, color: '#444' },
  roleList: { marginTop: 10, gap: 15 },
  roleRow: { flexDirection: 'row', gap: 15 },
  roleIconBox: { width: 60, alignItems: 'center' },
  roleIcon: { width: 35, height: 35, marginBottom: 5 },
  roleIconLabel: { fontSize: 11, fontWeight: 'bold' },
  roleTextContent: { flex: 1 },
  roleName: { fontSize: 15, fontWeight: 'bold' },

  fieldLabel: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  errorBorder: { borderColor: '#E53E3E', borderWidth: 1 },
  errorText: { color: '#E53E3E', fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  pickerBox: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#E5E7EB', borderRadius: 10, borderWidth: 1, borderColor: '#CCCCCC' },
  pickerText: { fontSize: 14 },
  pickerArrow: { fontWeight: 'bold' },
  dropdownMenu: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#CCC', marginTop: 5 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  dropdownItemText: { fontSize: 14 },
  roleSelectionRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  roleSelectCard: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#CCC' },
  roleSelectActive: { borderColor: '#4273B8', backgroundColor: '#EBF3FF' },
  roleSelectIcon: { width: 35, height: 35, marginBottom: 6 },
  roleSelectText: { fontSize: 12, fontWeight: 'bold' },
  roleSelectTextActive: { color: '#4273B8' },

  documentsContainer: { gap: 10, marginBottom: 20 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 8, backgroundColor: '#FAFAFA' },
  uploadInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docIcon: { fontSize: 16, marginRight: 8 },
  uploadText: { fontSize: 12, color: '#555' },
  uploadBtn: { backgroundColor: '#4273B8', padding: 6, borderRadius: 6 },
  uploadBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  capacityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 15 },
  capacityLabel: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  siteBadge: { backgroundColor: '#D9D9D9', padding: 5, borderRadius: 8, marginLeft: 10 },
  siteBadgeText: { fontSize: 11, fontWeight: 'bold' },
  badge: { padding: 5, borderRadius: 12 },
  badgeModerate: { backgroundColor: '#38A169' },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  checkboxGroup: { gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxSquare: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#111', marginRight: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  checkboxSquareActive: { backgroundColor: '#111' },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 13, flex: 1 },

  // STEP 3 QUESTIONNAIRE (ALIGNED & CLEANED)
  qSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  // UPDATED: Added alignItems center to ensure pills and text line up vertically
  qQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  qQuestionText: { fontSize: 13, flex: 1, paddingRight: 10, lineHeight: 20, color: '#111' },
  
  pillToggle: { flexDirection: 'row', gap: 8 },
  // UPDATED: Added fixed width and text alignment to match the web app
  pillOption: { width: 70, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB', borderRadius: 20 },
  pillOptionActive: { backgroundColor: '#4273B8' },
  pillText: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },
  pillTextActive: { color: '#FFFFFF' },

  // The green box inherently has 20px of padding, which indented its questions
  healthBannerClean: { backgroundColor: '#EAF5EA', padding: 20, borderRadius: 12, marginVertical: 15 },
  healthDesc: { fontSize: 12, color: '#22543D', marginBottom: 15, fontStyle: 'italic' },
  
  transpoInput: { backgroundColor: '#E5E7EB', padding: 12, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  
  conductChecksContainer: { gap: 12 },
  conductCheckCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 15 },
  conductCheckCardActive: { borderColor: '#4273B8', backgroundColor: '#F4F8FF' },
  conductCheckboxSquare: { width: 22, height: 22, borderWidth: 1.5, borderColor: '#111', marginRight: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 4, marginTop: 2 },
  conductCheckboxActive: { backgroundColor: '#4273B8', borderColor: '#4273B8' },
  conductCheckmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  conductCheckLabel: { fontSize: 13, flex: 1, lineHeight: 20, color: '#333' },
  
  warningText: { fontSize: 12, color: '#444' },
  step3ActionRow: { flexDirection: 'row', gap: 10 },
  backBtnStep3: { flex: 1, backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  backBtnTextStep3: { color: '#111', fontSize: 15, fontWeight: 'bold' },
  submitBtnStep3: { flex: 2, backgroundColor: '#4273B8', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnTextStep3: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  // STEP 4 SUCCESS
  step4Container: { flex: 1 },
  successCard: { backgroundColor: '#FAFAFA', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#CCC' },
  successHeaderRow: { backgroundColor: '#4273B8', padding: 15, alignItems: 'center' },
  successHeaderText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  successBody: { padding: 25, alignItems: 'center' },
  
  checkmarkIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', borderWidth: 3, borderColor: '#2D8A61', alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 2 },
  checkmarkIconText: { color: '#2D8A61', fontSize: 40, fontWeight: 'bold', marginTop: -3 },

  thankYouTitle: { fontSize: 22, fontWeight: 'bold' },
  successDescText: { fontSize: 13, textAlign: 'center', marginVertical: 10 },
  successDetailText: { fontSize: 14, color: '#333', textAlign: 'center' },
  
  // NEW DONOR PROMPT STYLES
  donorPromptText: { fontSize: 18, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  yesDonorBtn: { backgroundColor: '#2D8A61', paddingVertical: 16, borderRadius: 12, alignItems: 'center', width: '100%' },
  yesDonorBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  noDonorBtn: { backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#CCC' },
  noDonorBtnText: { color: '#444', fontSize: 15, fontWeight: 'bold' },
});