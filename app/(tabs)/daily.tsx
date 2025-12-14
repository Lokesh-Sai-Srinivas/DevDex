import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { completeDailyTask, generateDailyQuiz, getStreak } from '../../constants/Database';

export default function DailyScreen() {
  const [quiz, setQuiz] = useState<any>(null);
  const [streak, setStreak] = useState({ count: 0, completedToday: false });
  const [loading, setLoading] = useState(true);
  
  // Quiz State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answered, setAnswered] = useState(false);

  useFocusEffect(
    useCallback(() => {
        refreshData();
    }, [])
  );

  const refreshData = async () => {
      setLoading(true);
      // 1. Get Streak
      const sData = await getStreak();
      setStreak(sData);

      // 2. Generate New Quiz
      // FIX: We now 'await' this because reading from the file system is async
      if (!answered) {
          const newQuiz = await generateDailyQuiz();
          setQuiz(newQuiz);
      }
      setLoading(false);
  };

  const handleOptionPress = async (optionId: string) => {
      if (answered) return; 

      setSelectedOption(optionId);
      setAnswered(true);

      if (optionId === quiz.correctOptionId) {
          setIsCorrect(true);
          await completeDailyTask();
          const sData = await getStreak();
          setStreak(sData);
      } else {
          setIsCorrect(false);
      }
  };

  const handleNextChallenge = () => {
      setAnswered(false);
      setSelectedOption(null);
      setIsCorrect(false);
      setQuiz(null); // Clear old quiz
      refreshData();
  };

  if (loading && !quiz) {
      return (
        <SafeAreaView style={[styles.container, {justifyContent: 'center'}]}>
            <ActivityIndicator size="large" color="#4db8ff" />
            <Text style={{color: '#666', marginTop: 10}}>Loading Challenge...</Text>
        </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Streak Header */}
      <View style={[styles.streakHeader, streak.completedToday && styles.streakActive]}>
        <Ionicons name="flame" size={32} color={streak.completedToday ? "#FF5733" : "#444"} />
        <View>
            <Text style={[styles.streakText, { color: streak.completedToday ? "#FF5733" : "#666"}]}>
                {streak.count} Day Streak
            </Text>
            <Text style={{color:'#666', fontSize:12, marginLeft: 10}}>
                {streak.completedToday ? "Great job today!" : "Complete the quiz to continue"}
            </Text>
        </View>
      </View>

      <Text style={styles.title}>Daily Quiz</Text>

      {quiz ? (
        <ScrollView style={{width: '100%'}} contentContainerStyle={{alignItems:'center'}}>
            
            {/* QUESTION CARD */}
            <View style={styles.questionCard}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{quiz.language}</Text>
                </View>
                <Text style={styles.questionText}>{quiz.question}</Text>
                <View style={styles.snippetBox}>
                    <Text style={styles.snippetText}>"{quiz.snippet}"</Text>
                </View>
            </View>

            {/* OPTIONS */}
            {quiz.options.map((opt: any) => {
                let btnStyle = styles.optionBtn;
                let iconName = "ellipse-outline";
                let iconColor = "#666";

                if (answered) {
                    if (opt.id === quiz.correctOptionId) {
                        btnStyle = styles.correctBtn; 
                        iconName = "checkmark-circle";
                        iconColor = "#4cd137";
                    } else if (opt.id === selectedOption) {
                        btnStyle = styles.wrongBtn;
                        iconName = "close-circle";
                        iconColor = "#e84118";
                    }
                }

                return (
                    <Pressable 
                        key={opt.id} 
                        style={btnStyle} 
                        onPress={() => handleOptionPress(opt.id)}
                    >
                        <Text style={styles.optionText}>{opt.title}</Text>
                        <Ionicons name={iconName} size={24} color={iconColor} />
                    </Pressable>
                );
            })}

            {/* NEXT BUTTON */}
            {answered && (
                <Pressable onPress={handleNextChallenge} style={styles.nextBtn}>
                    <Text style={styles.nextText}>
                        {isCorrect ? "Continue" : "Try Another"}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#000" />
                </Pressable>
            )}

        </ScrollView>
      ) : (
        <View style={{alignItems: 'center', marginTop: 50}}>
            <Ionicons name="library-outline" size={50} color="#333" />
            <Text style={{color:'#666', marginTop: 10, textAlign:'center'}}>
                Not enough topics for a quiz.{'\n'}Download more languages from the Store!
            </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 15, paddingTop: 20, alignItems: 'center' },
  streakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#1E1E1E', padding: 15, borderRadius: 20, width: '100%' },
  streakActive: { borderColor: '#FF5733', borderWidth: 1 },
  streakText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  
  questionCard: { width: '100%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, marginBottom: 20 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: '#AAA', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  questionText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  snippetBox: { backgroundColor: '#121212', padding: 15, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#4db8ff' },
  snippetText: { color: '#DDD', fontSize: 16, fontStyle: 'italic', lineHeight: 22 },

  optionBtn: { width: '100%', backgroundColor: '#1E1E1E', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  correctBtn: { width: '100%', backgroundColor: '#1E1E1E', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#4cd137' },
  wrongBtn: { width: '100%', backgroundColor: '#1E1E1E', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e84118' },
  
  optionText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  nextBtn: { marginTop: 10, backgroundColor: '#4db8ff', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center' },
  nextText: { color: '#000', fontWeight: 'bold', marginRight: 5 }
});