import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SectionList, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native'; // Removed View from root usage
import { SafeAreaView } from 'react-native-safe-area-context'; // Added this
import { getFavoriteTopics, getLanguages } from '../../constants/Database';

interface FavoriteTopic {
  id: string;
  title: string;
  description: string;
  code: string;
  group: string;
  langColor: string;
  langIcon: string;
  langName: string;
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteTopic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Reload favorites every time we visit this tab
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const favTopics = await getFavoriteTopics();
      const languages = await getLanguages();
      
      // Enrich favorite topics with language info
      const enrichedFavorites = favTopics.map(topic => {
        const lang = languages.find(l => l.topics?.some(t => t.id === topic.id));
        return {
          ...topic,
          langIcon: lang?.icon || '📄',
          langName: lang?.name || 'Unknown',
          group: topic.group || 'General'
        };
      });
      
      setFavorites(enrichedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Optionally, you might want to set some error state here
    }
  };

  // Group favorites by language
  const groupedFavorites = favorites.reduce<{[key: string]: FavoriteTopic[]}>((acc, item) => {
    const lang = item.langName;
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(item);
    return acc;
  }, {});

  const sections = Object.entries(groupedFavorites).map(([title, data]) => ({
    title,
    data,
    icon: data[0]?.langIcon || '📄'
  }));

  // Filter favorites based on search query
  const filteredSections = searchQuery
    ? sections.map(section => ({
        ...section,
        data: section.data.filter(
          item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.langName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.data.length > 0)
    : sections;

  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Your Library</Text>
        <Text style={styles.subtitle}>{favorites.length} Saved Snippets</Text>
        
        {favorites.length > 0 && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your snippets..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>Your Library is Empty</Text>
          <Text style={styles.emptySub}>Save your favorite code snippets and they'll appear here.</Text>
          <Text style={styles.emptyHint}>💡 Tap the heart icon on any code card to save it.</Text>
        </View>
      ) : filteredSections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-off-outline" size={60} color="#333" />
          <Text style={styles.emptyText}>No matches found</Text>
          <Text style={styles.emptySub}>Try a different search term</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title, icon } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{icon}</Text>
              <Text style={styles.sectionTitle}>{title}</Text>
              <View style={styles.sectionDivider} />
            </View>
          )}
          renderItem={({ item }) => (
            <Link href={`/detail/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <View style={[styles.colorBar, { backgroundColor: item.langColor || '#888' }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={[styles.langBadge, { backgroundColor: `${item.langColor}20` }]}>
                      <Text style={[styles.langText, { color: item.langColor }]}>
                        {item.group}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#444" />
              </Pressable>
            </Link>
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
    paddingTop: 30,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
    marginLeft: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: 16,
    height: 80,
  },
  colorBar: {
    width: 4,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
    flexShrink: 1,
  },
  langBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  separator: {
    height: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyHint: {
    color: '#444',
    fontSize: 14,
    marginTop: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});