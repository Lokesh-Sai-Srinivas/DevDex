// FIX: Import from 'legacy' to stop the crash
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import bundledData from '../assets/data.json';

const DATA_DIR = FileSystem.documentDirectory + 'docs/';

// --- INITIALIZATION ---
const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(DATA_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DATA_DIR, { intermediates: true });
    }
};

// --- DATA FETCHING (HYBRID) ---

// ... imports stay the same ...

export const getLanguages = async () => {
    await ensureDirExists();
    
    // 1. Start with Bundled Data (Safety check: ensure it's an array)
    let allLanguages = Array.isArray(bundledData.languages) ? [...bundledData.languages] : [];

    // 2. Read Downloaded Files from Phone Storage
    try {
        const files = await FileSystem.readDirectoryAsync(DATA_DIR);
        for (const file of files) {
            try {
                const content = await FileSystem.readAsStringAsync(DATA_DIR + file);
                const json = JSON.parse(content);
                
                // VALIDATION: Does it have the required fields?
                if (json.id && json.topics && Array.isArray(json.topics)) {
                    allLanguages = allLanguages.filter(l => l.id !== json.id);
                    allLanguages.push(json);
                } else {
                    console.log(`Skipping invalid file: ${file}`);
                    // Optional: Delete bad file automatically
                    // await FileSystem.deleteAsync(DATA_DIR + file);
                }
            } catch (parseError) {
                console.log(`Corrupt JSON in ${file}, deleting...`);
                // Auto-delete bad files so they don't crash the app again
                await FileSystem.deleteAsync(DATA_DIR + file);
            }
        }
    } catch (e) {
        console.log("Error reading directory:", e);
    }

    return allLanguages;
};

// ... keep the rest of the file the same ...

export const getCategorizedLanguages = async () => {
    const langs = await getLanguages();
    const categories = {};
    
    langs.forEach(lang => {
        const cat = lang.category || 'Downloaded';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(lang);
    });

    return Object.keys(categories).map(key => ({ title: key, data: categories[key] }));
};

export const getTopicById = async (topicId) => {
    const langs = await getLanguages();
    for (let lang of langs) {
        const topic = lang.topics.find(t => t.id === topicId);
        if (topic) {
            return { 
                ...topic, 
                langName: lang.name, 
                langColor: lang.color,
                langIcon: lang.icon 
            };
        }
    }
    return null;
};

export const getTopics = async (languageId) => {
    const langs = await getLanguages();
    const language = langs.find((lang) => lang.id === languageId);
    return language ? language.topics : [];
};

// --- DOWNLOAD SYSTEM ---

export const downloadLanguagePack = async (url, filename) => {
    await ensureDirExists();
    try {
        const fileUri = DATA_DIR + filename;
        const downloadRes = await FileSystem.downloadAsync(url, fileUri);
        return downloadRes.status === 200;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deleteLanguagePack = async (filename) => {
    try {
        await FileSystem.deleteAsync(DATA_DIR + filename);
        return true;
    } catch(e) { return false; }
};

// --- QUIZ & STREAK ---

export const generateDailyQuiz = async () => {
    const allLangs = await getLanguages();
    const allTopics = [];
    
    allLangs.forEach(lang => {
        lang.topics.forEach(t => {
            allTopics.push({ ...t, langName: lang.name, langColor: lang.color });
        });
    });

    if (allTopics.length < 4) return null;

    const correctIndex = Math.floor(Math.random() * allTopics.length);
    const correctTopic = allTopics[correctIndex];

    const options = [correctTopic];
    while (options.length < 4) {
        const randomT = allTopics[Math.floor(Math.random() * allTopics.length)];
        if (!options.find(o => o.id === randomT.id)) {
            options.push(randomT);
        }
    }

    return {
        question: `Which concept does this description belong to?`,
        snippet: correctTopic.description,
        language: correctTopic.langName,
        correctOptionId: correctTopic.id,
        options: options.sort(() => Math.random() - 0.5)
    };
};

export const getStreak = async () => {
    try {
        const streak = await AsyncStorage.getItem('@streak_count');
        const lastDate = await AsyncStorage.getItem('@last_completed_date');
        const today = new Date().toDateString();
        return { count: streak ? parseInt(streak) : 0, completedToday: lastDate === today };
    } catch(e) { return { count: 0, completedToday: false }; }
};

export const completeDailyTask = async () => {
    try {
        const today = new Date().toDateString();
        const lastDate = await AsyncStorage.getItem('@last_completed_date');
        if (lastDate !== today) {
            const currentStreak = await AsyncStorage.getItem('@streak_count');
            const newCount = (currentStreak ? parseInt(currentStreak) : 0) + 1;
            await AsyncStorage.setItem('@streak_count', newCount.toString());
            await AsyncStorage.setItem('@last_completed_date', today);
        }
    } catch(e) { console.error(e); }
};

// --- FAVORITES ---
export const toggleFavorite = async (topicId) => {
    try {
      const jsonValue = await AsyncStorage.getItem('@favorites');
      let favorites = jsonValue != null ? JSON.parse(jsonValue) : [];
      if (favorites.includes(topicId)) favorites = favorites.filter(id => id !== topicId);
      else favorites.push(topicId);
      await AsyncStorage.setItem('@favorites', JSON.stringify(favorites));
      return favorites;
    } catch (e) { return []; }
};
  
export const checkIsFavorite = async (topicId) => {
    try {
      const jsonValue = await AsyncStorage.getItem('@favorites');
      const favorites = jsonValue != null ? JSON.parse(jsonValue) : [];
      return favorites.includes(topicId);
    } catch (e) { return false; }
};

export const getFavoriteTopics = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem('@favorites');
        const favIds = jsonValue != null ? JSON.parse(jsonValue) : [];
        let foundTopics = [];
        const allLangs = await getLanguages(); 
        
        favIds.forEach(favId => {
            for(let lang of allLangs) {
                const found = lang.topics.find(t => t.id === favId);
                if(found) {
                    foundTopics.push({...found, langName: lang.name, langColor: lang.color});
                    break;
                }
            }
        });
        return foundTopics;
    } catch(e) { return []; }
};