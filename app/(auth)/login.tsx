import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
   StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSession } from '../../lib/useSession';
import { login } from '../../lib/auth';

export default function LoginScreen() {
  const { setUser } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email/phone and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      setUser(user);
    } catch (e: any) {
      Alert.alert('Login failed', e.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.org}>Ritanya Sanstha</Text>
          <Text style={styles.title}>COV â€“ AIIMS Delhi</Text>
          <Text style={styles.subtitle}>Alumni Community</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email or Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com or +11â€¦"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"Æ6V†öÆFW%FW‡D6öÆ÷#Ò"3–66b ¢6V7W&UFW‡DVçG'¢fÇVS×·77v÷&GÐ¢öä6†ævUFW‡C×·6WE77v÷&GÐ¢óà ¢ÅF÷V6†&ÆT÷6—G¢7G–ÆS×µ·7G–ÆW2æ'WGFöâÂÆöF–ærbb7G–ÆW2æ'WGFöäF—6&ÆVE×Ð¢öå&W73×¶†æFÆTÆöv–çÐ¢F—6&ÆVC×¶ÆöF–æwÐ¢à¢¶ÆöF–ærò€¢Ä7F—f—G”–æF–6F÷"6öÆ÷#Ò"6ffb"óà¢’¢€¢ÅFW‡B7G–ÆS×·7G–ÆW2æ'WGFöåFW‡GÓå6–vâ–ãÂõFW‡Cà¢—Ð¢ÂõF÷V6†&ÆT÷6—G“à¢Âõf–Wsà ¢ÅFW‡B7G–ÆS×·7G–ÆW2æfö÷FW'Óà¢f÷"66W72Â6öçF7B–÷W"4õb(	2””Õ2FVÆ†’FÖ–æ—7G&F÷"à¢ÂõFW‡Cà¢Âõ67&öÆÅf–Wsà¢Âô¶W–&ö&Dfö–F–æuf–Wsà¢“°§Ð ¦6öç7B7G–ÆW2Ò7G–ÆU6†VWBæ7&VFR‡°¢fÆWƒ¢²fÆWƒ¢Â&6¶w&÷VæD6öÆ÷#¢r6c†ff2rÒÀ¢6öçF–æW#¢°¢fÆW„w&÷s¢À¢§W7F–g”6öçFVçC¢v6VçFW"rÀ¢FF–æs¢#BÀ¢ÒÀ¢†VFW#¢°¢Æ–vä—FV×3¢v6VçFW"rÀ¢Ö&v–ä&÷GFöÓ¢CÀ¢ÒÀ¢÷&s¢°¢föçE6—¦S¢2À¢6öÆ÷#¢r3f#s#ƒrÀ¢ÆWGFW%76–æs¢À¢FW‡EG&ç6f÷&Ó¢wWW&66RrÀ¢Ö&v–ä&÷GFöÓ¢BÀ¢ÒÀ¢F—FÆS¢°¢föçE6—¦S¢#‚À¢föçEvV–v‡C¢ssrÀ¢6öÆ÷#¢r3SfF"rÀ¢Ö&v–ä&÷GFöÓ¢BÀ¢ÒÀ¢7V'F—FÆS¢°¢föçE6—¦S¢bÀ¢6öÆ÷#¢r33sCSrÀ¢ÒÀ¢f÷&Ó¢°¢&6¶w&÷VæD6öÆ÷#¢r6ffbrÀ¢&÷&FW%&F—W3¢bÀ¢FF–æs¢#BÀ¢6†F÷t6öÆ÷#¢r3rÀ¢6†F÷töfg6WC¢²v–GFƒ¢Â†V–v‡C¢"ÒÀ¢6†F÷t÷6—G“¢ãrÀ¢6†F÷u&F—W3¢‚À¢VÆWfF–öã¢2À¢Ö&v–ä&÷GFöÓ¢#BÀ¢ÒÀ¢Æ&VÃ¢°¢föçE6—¦S¢2À¢föçEvV–v‡C¢scrÀ¢6öÆ÷#¢r33sCSrÀ¢Ö&v–ä&÷GFöÓ¢bÀ¢Ö&v–åF÷¢"À¢ÒÀ¢–çWC¢°¢&÷&FW%v–GFƒ¢À¢&÷&FW$6öÆ÷#¢r6CCVF"rÀ¢&÷&FW%&F—W3¢À¢FF–æs¢"À¢föçE6—¦S¢RÀ¢6öÆ÷#¢r3ƒ#rrÀ¢&6¶w&÷VæD6öÆ÷#¢r6c–ff"rÀ¢ÒÀ¢'WGFöã¢°¢&6¶w&÷VæD6öÆ÷#¢r3SfF"rÀ¢&÷&FW%&F—W3¢À¢FF–æs¢BÀ¢Æ–vä—FV×3¢v6VçFW"rÀ¢Ö&v–åF÷¢#BÀ¢ÒÀ¢'WGFöäF—6&ÆVC¢²÷6—G“¢ãbÒÀ¢'WGFöåFW‡C¢°¢6öÆ÷#¢r6ffbrÀ¢föçE6—¦S¢bÀ¢föçEvV–v‡C¢scrÀ¢ÒÀ¢fö÷FW#¢°¢FW‡DÆ–vã¢v6VçFW"rÀ¢föçE6—¦S¢"À¢6öÆ÷#¢r3–66brÀ¢Ö&v–åF÷¢‚À¢ÒÀ§Ò“°