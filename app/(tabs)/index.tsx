import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SectionList, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategorizedLanguages, getStreak } from '../../constants/Database';

export default function HomeScreen() {
  const [filteredData, setFilteredData] = useState([]);
  const [allData, setAllData] = useState([]); 
  const [streak, setStreak] = useState({ count: 0, completedToday: false });
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const sData = await getStreak();
    setStreak(sData);

    const catData = await getCategorizedLanguages();
    setAllData(catData);
    
    if(searchQuery === '') {
        setFilteredData(catData);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredData(allData);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = allData.map(section => {
        const filteredItems = section.data.filter(item => 
          item.name.toLowerCase().includes(lowerText) || 
          section.title.toLowerCase().includes(lowerText)
        );
        return { ...section, data: filteredItems };
      }).filter(section => section.data.length > 0);
      setFilteredData(filtered);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>DevDex</Text>
        
        <View style={{flexDirection: 'row', gap: 10}}>
             {/* NEW: Store Button */}
            <Link href="/store" asChild>
                <Pressable style={styles.iconButton}>
                    <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
                </Pressable>
            </Link>

             {/* Streak Widget */}
            <View style={styles.streakContainer}>
                <Ionicons 
                    name="flame" 
                    size={20} 
                    color={streak.completedToday ? "#FF5733" : "#444"} 
                />
                {streak.completedToday && (
                    <Text style={styles.streakCount}>{streak.count}</Text>
                )}
            </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
          placeholder="Search 'Java' or 'Web'" 
          placeholderTextColor="#666"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
            <Ionicons name="close-circle" size={20} color="#666" onPress={() => handleSearch('')}/>
        )}
      </View>

      <SectionList
        sections={filteredData}
        keyExtractor={(item, index) => item.id + index}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <Link href={`/topic/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.langName}>{item.name}</Text>
                <Text style={styles.topicCount}>{item.topics.length} Concepts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#444" />
            </Pressable>
          </Link>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 12, paddingTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10, paddingHorizontal: 5 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  
  streakContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  streakCount: { color: '#FF5733', fontWeight: 'bold', marginLeft: 6, fontSize: 16 },
  
  iconButton: { padding: 8, backgroundColor: '#1E1E1E', borderRadius: 20, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },

  searchContainer: { backgroundColor: '#1E1E1E', borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#333' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#888', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 5 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 10, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  iconBox: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  icon: { fontSize: 22 },
  cardText: { flex: 1 },
  langName: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  topicCount: { fontSize: 13, color: '#666', marginTop: 2 },
});