import { View, Text, TextInput, ScrollView, Pressable, Image, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// Placeholder data
const RECENT_SEARCHES = ['Dune', 'Batman', 'Interstellar', 'Poor Things'];
const SEARCH_RESULTS = [
  { id: '1', title: 'Dune: Part Two', year: '2024', poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGqqUT1e.jpg' },
  { id: '9', title: 'Dune', year: '2021', poster: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#0f172a]">
      {/* Search Header */}
      <View className="px-4 py-3 flex-row items-center justify-between z-10 border-b border-white/5 bg-[#0f172a]/90 backdrop-blur-md">
        <View className="flex-1 flex-row items-center bg-slate-800 rounded-xl px-3 h-11 border border-slate-700">
          <SearchIcon size={20} color={isFocused ? "#38bdf8" : "#64748b"} />
          <TextInput
            className="flex-1 text-slate-50 text-[16px] ml-2 font-medium"
            placeholder="Movies, shows, or people..."
            placeholderTextColor="#475569"
            value={query}
            onChangeText={setQuery}
            autoFocus
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={Keyboard.dismiss}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} className="p-1">
              <X size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()} className="ml-4">
          <Text className="text-slate-300 font-semibold text-[16px]">Cancel</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {query.length === 0 ? (
          /* Recent Searches */
          <View>
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Recent Searches</Text>
            {RECENT_SEARCHES.map((term, index) => (
              <Pressable 
                key={index}
                className="flex-row items-center py-3 border-b border-white/5"
                onPress={() => setQuery(term)}
              >
                <Clock size={18} color="#64748b" className="mr-3" />
                <Text className="text-slate-300 font-medium text-[16px] flex-1">{term}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          /* Search Results */
          <View>
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Results for "{query}"</Text>
            {SEARCH_RESULTS.map((item) => (
              <Pressable 
                key={item.id}
                className="flex-row items-center mb-4 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50"
                onPress={() => router.push(`/player?id=${item.id}`)}
              >
                <Image 
                  source={{ uri: item.poster }} 
                  className="w-16 h-24 rounded-lg bg-slate-900"
                  resizeMode="cover"
                />
                <View className="ml-4 flex-1 justify-center">
                  <Text className="text-slate-50 text-[16px] font-bold mb-1" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-slate-400 text-[13px] font-medium">{item.year}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
