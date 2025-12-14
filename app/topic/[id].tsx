import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLanguages, getTopics } from '../../constants/Database';

export default function TopicScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter(); 
  
  // 1. Create State for Data (since it loads async now)
  const [currentLang, setCurrentLang] = useState<any>(null);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Load Data Async
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    
    // Fetch Languages and find the current one
    const langs = await getLanguages();
    const lang = langs.find((l: any) => l.id === id);
    
    // Fetch Topics for this language
    const topics = await getTopics(id);

    if (lang) setCurrentLang(lang);
    if (topics) {
        setAllTopics(topics);
        setFilteredTopics(topics);
    }
    setLoading(false);
  };

  // Search Logic
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredTopics(allTopics);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = allTopics.filter(t => 
        (t.title && t.title.toLowerCase().includes(lowerText)) || 
        (t.description && t.description.toLowerCase().includes(lowerText))
      );
      setFilteredTopics(filtered);
    }
  };

  // Grouping Logic
  const groupedTopics = filteredTopics.reduce((acc, topic) => {
    const groupName = topic.group || 'General';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(topic);
    return acc;
  }, {});

  const sections = Object.keys(groupedTopics).map(key => ({
    title: key,
    data: groupedTopics[key]
  }));

  // 3. Loading State (Prevents the crash)
  if (loading) {
    return (
        <SafeAreaView style={[styles.safeContainer, {justifyContent: 'center', alignItems: 'center'}]}>
             <ActivityIndicator size="large" color="#4db8ff" />
        </SafeAreaView>
    );
  }

  // 4. Error State (If language not found)
  if (!currentLang) {
      return (
        <SafeAreaView style={[styles.safeContainer, {justifyContent: 'center', alignItems: 'center'}]}>
            <Text style={{color: '#fff'}}>Language not found.</Text>
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

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{currentLang.name}</Text>
        <View style={{width: 26}} />
      </View>

      <View style={styles.container}>
        <View style={styles.localSearch}>
            <Ionicons name="search" size={16} color="#666" style={{marginRight: 8}}/>
            <TextInput 
                placeholder={`Search inside ${currentLang.name}...`} 
                placeholderTextColor="#666"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
                <Ionicons name="close-circle" size={16} color="#666" onPress={() => handleSearch('')}/>
            )}
        </View>

        <SectionList
            sections={sections}
            keyExtractor={(item, index) => item.id + index}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item }) => (
            <Link href={`/detail/${item.id}`} asChild>
                <Pressable style={styles.item}>
                <View style={styles.textGroup}>
                    <Text style={styles.topicTitle}>{item.title}</Text>
                    <Text style={styles.topicDesc} numberOfLines={1}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#444" />
                </Pressable>
            </Link>
            )}
            ListEmptyComponent={
                <Text style={styles.emptyText}>No topics found.</Text>
            }
            contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, paddingHorizontal: 10 },
  
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  navButton: { padding: 5 },
  navTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },

  localSearch: { backgroundColor: '#1E1E1E', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  searchInput: { flex: 1, color: '#FFF' },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#4db8ff', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  item: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#2A2A2A' },
  textGroup: { flex: 1, paddingRight: 10 },
  topicTitle: { fontSize: 16, fontWeight: '600', color: '#DDD', marginBottom: 2 },
  topicDesc: { fontSize: 13, color: '#777' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 20 }
});