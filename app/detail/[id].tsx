import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkIsFavorite, getTopicById, toggleFavorite } from '../../constants/Database';

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter(); 
  
  // 1. STATE: Hold the data here
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // 2. EFFECT: Load data when screen opens
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const data = await getTopicById(id); // Wait for file system
    setTopic(data);
    
    const status = await checkIsFavorite(id);
    setIsFav(status);
    setLoading(false);
  };

  const handleToggleFav = async () => {
    await toggleFavorite(id);
    setIsFav(!isFav); 
  };

  const copyToClipboard = async () => {
    if (topic?.code) {
        await Clipboard.setStringAsync(topic.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (topic) {
        try {
        await Share.share({
            message: `Check out this syntax for ${topic.title}:\n\n${topic.code}\n\nSent from DevDex`,
        });
        } catch (error) {
        // ignore
        }
    }
  };

  // 3. LOADING STATE
  if (loading) {
    return (
        <SafeAreaView style={[styles.safeContainer, {justifyContent: 'center', alignItems: 'center'}]}>
             <ActivityIndicator size="large" color="#4db8ff" />
        </SafeAreaView>
    );
  }

  // 4. NOT FOUND STATE
  if (!topic) {
      return (
        <SafeAreaView style={[styles.safeContainer, {justifyContent: 'center', alignItems: 'center'}]}>
            <Text style={{color: '#fff'}}>Topic not found.</Text>
            <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
                <Text style={{color: '#4db8ff'}}>Go Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />
      
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- CUSTOM HEADER BAR --- */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToggleFav} style={styles.navButton}>
            <Ionicons 
                name={isFav ? "heart" : "heart-outline"} 
                size={28} 
                color={isFav ? "#ff4757" : "#FFF"} 
            />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        
        <View style={styles.header}>
            <View style={[styles.langBadge, { backgroundColor: (topic.langColor || '#666') + '20', borderColor: topic.langColor || '#666' }]}>
                <Text style={[styles.langText, { color: topic.langColor || '#fff' }]}>{topic.langName}</Text>
            </View>
            <Text style={styles.title}>{topic.title}</Text>
        </View>

        <View style={styles.definitionBox}>
            <Text style={styles.defLabel}>DEFINITION</Text>
            <Text style={styles.defText}>{topic.description}</Text>
        </View>

        <View style={styles.codeContainer}>
            <View style={styles.codeHeader}>
            <Text style={styles.codeLabel}>SYNTAX</Text>
            <View style={{flexDirection: 'row', gap: 15}}>
                <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={copyToClipboard} style={{flexDirection:'row', alignItems:'center'}}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color="#FFF" />
                {copied && <Text style={styles.copyText}>Copied</Text>}
                </TouchableOpacity>
            </View>
            </View>

            <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{topic.code}</Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#121212' },
  scrollContainer: { paddingHorizontal: 20 },
  
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  navButton: { padding: 5 },

  header: { marginBottom: 20 },
  langBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  langText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#FFF' },
  
  definitionBox: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#4db8ff' },
  defLabel: { color: '#4db8ff', fontSize: 10, fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  defText: { color: '#DDD', fontSize: 16, lineHeight: 22 },
  
  codeContainer: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#333', marginBottom: 40 },
  codeHeader: { backgroundColor: '#252526', padding: 12, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  codeLabel: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  copyText: { color: '#4db8ff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  
  codeBlock: { backgroundColor: '#0d1117', padding: 15 },
  codeText: { color: '#c9d1d9', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14, lineHeight: 20 }
});