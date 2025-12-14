import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteLanguagePack, downloadLanguagePack, getLanguages } from '../constants/Database';

// YOUR GIST URL
const MASTER_CATALOG_URL = 'https://gist.githubusercontent.com/Lokesh-Sai-Srinivas/35667dd39d77ef76cdd7b0bdda28b239/raw/40300a88e65bb707c38d98be01580e6921ede915/catalog.json';

export default function StoreScreen() {
  const router = useRouter();
  const [catalog, setCatalog] = useState([]); 
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false); 
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // NEW: Search State
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCatalog();
    checkDownloads();
  }, []);

  const checkDownloads = async () => {
    const langs = await getLanguages();
    setDownloadedIds(langs.map(l => l.id));
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const response = await fetch(MASTER_CATALOG_URL);
      const data = await response.json();
      setCatalog(data);
    } catch (error) {
      console.log("Could not fetch catalog:", error);
      Alert.alert("Offline", "Could not connect to the Store. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (item: any) => {
    setDownloadingId(item.id);
    const success = await downloadLanguagePack(item.url, item.filename);
    setDownloadingId(null);
    
    if (success) {
        Alert.alert("Success", `${item.name} has been added to your library!`);
        checkDownloads(); 
    } else {
        Alert.alert("Error", "Could not download package. Check URL or internet.");
    }
  };

  const handleDelete = async (item: any) => {
    Alert.alert(
      "Remove Language",
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: 'destructive',
          onPress: async () => {
            await deleteLanguagePack(item.filename);
            setDownloadedIds(prev => prev.filter(id => id !== item.id)); 
          }
        }
      ]
    );
  };

  // NEW: Filter Logic
  const filteredCatalog = catalog.filter((item: any) => {
      const query = searchQuery.toLowerCase();
      return (
          item.name.toLowerCase().includes(query) || 
          item.category.toLowerCase().includes(query)
      );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{marginBottom: 10}}>
             <Ionicons name="arrow-back" size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>Doc Store</Text>
        <Text style={styles.subtitle}>Expand your knowledge base</Text>
      </View>

      {/* NEW: Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
          placeholder="Search 'Python' or 'Web'..." 
          placeholderTextColor="#666"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
            <Ionicons name="close-circle" size={20} color="#666" onPress={() => setSearchQuery('')}/>
        )}
      </View>

      {loading && catalog.length === 0 ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4db8ff" />
            <Text style={{color:'#666', marginTop: 10}}>Connecting to server...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCatalog} // Use filtered list
          keyExtractor={(item: any) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchCatalog} tintColor="#fff" />
          }
          ListEmptyComponent={
            <View style={styles.center}>
                <Ionicons name={searchQuery ? "search" : "cloud-offline-outline"} size={50} color="#333" />
                <Text style={{color:'#666', marginTop: 10}}>
                    {searchQuery ? "No matching packs found." : "No packs found or Offline."}
                </Text>
                {!searchQuery && (
                    <Pressable onPress={fetchCatalog} style={styles.retryBtn}>
                        <Text style={styles.btnText}>Retry</Text>
                    </Pressable>
                )}
            </View>
          }
          renderItem={({ item }: {item:any}) => {
              const isInstalled = downloadedIds.includes(item.id);
              return (
                  <View style={styles.card}>
                      <View style={[styles.iconBox, {backgroundColor: item.color + '20'}]}>
                          <Text style={{fontSize: 24}}>{item.icon}</Text>
                      </View>
                      <View style={{flex:1}}>
                          <Text style={styles.name}>{item.name}</Text>
                          <Text style={styles.cat}>{item.category}</Text>
                      </View>
                      
                      {isInstalled ? (
                          <Pressable 
                              style={[styles.btn, styles.btnDelete]}
                              onPress={() => handleDelete(item)}
                          >
                              <Ionicons name="trash-outline" size={20} color="#ff4757" />
                          </Pressable>
                      ) : (
                          <Pressable 
                              style={[styles.btn, styles.btnDownload]}
                              onPress={() => handleDownload(item)}
                              disabled={downloadingId === item.id}
                          >
                              {downloadingId === item.id ? (
                                  <ActivityIndicator color="#FFF" size="small" />
                              ) : (
                                  <Text style={styles.btnText}>Get</Text>
                              )}
                          </Pressable>
                      )}
                  </View>
              );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { marginBottom: 15 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  subtitle: { color: '#888', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  
  // Search Styles
  searchContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16 },

  // Card Styles
  card: { flexDirection: 'row', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  name: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cat: { color: '#888', fontSize: 14 },
  
  btn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  btnDownload: { backgroundColor: '#4db8ff' },
  btnDelete: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333', paddingHorizontal: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  
  retryBtn: { marginTop: 15, padding: 10, backgroundColor: '#333', borderRadius: 8 }
});