import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Play, Plus, Info } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useProvider } from '../../src/context/ProviderContext';
import { LinearGradient } from 'expo-linear-gradient';

// Placeholder data since Go API is not fully wired up yet
const TRENDING_MOVIES = [
  { id: '1', title: 'Dune: Part Two', poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGqqUT1e.jpg' },
  { id: '2', title: 'Oppenheimer', poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
  { id: '3', title: 'Spider-Man: Across the Spider-Verse', poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg' },
  { id: '4', title: 'The Batman', poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg' },
];

const NEW_RELEASES = [
  { id: '5', title: 'Poor Things', poster: 'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8Ph1SqzJ6V6s3O6Qn.jpg' },
  { id: '6', title: 'Godzilla Minus One', poster: 'https://image.tmdb.org/t/p/w500/q23mhnz1R9Q1hXy4F6FqKqK0Oq9.jpg' },
  { id: '7', title: 'Anatomy of a Fall', poster: 'https://image.tmdb.org/t/p/w500/kQs6kehvlRsTrISX61T3b66IalH.jpg' },
  { id: '8', title: 'Killers of the Flower Moon', poster: 'https://image.tmdb.org/t/p/w500/dB6Krk806zeie0ZpGkPHE45Eaqz.jpg' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { providerUrl } = useProvider();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching from Go API
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, [providerUrl]);

  const renderMovieRow = (title: string, data: typeof TRENDING_MOVIES) => (
    <View className="mb-8">
      <Text className="text-white text-lg font-bold mb-3 px-4 tracking-wide">{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {data.map((item, index) => (
          <Pressable 
            key={item.id} 
            className="mr-3"
            onPress={() => router.push(`/player?id=${item.id}`)}
          >
            <View className="w-32 h-48 rounded-xl bg-slate-800 overflow-hidden border border-white/10">
              <Image 
                source={{ uri: item.poster }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0f172a] items-center justify-center">
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f172a]">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Featured Hero Banner */}
        <View className="w-full h-[500px] relative">
          <Image 
            source={{ uri: 'https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtecsmEZz4Z6V.jpg' }} // Example featured image
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.6)', '#0f172a']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
          />
          
          {/* Header Nav */}
          <SafeAreaView className="flex-row justify-between items-center px-4 w-full pt-2 absolute top-0 z-10">
            <View className="w-10 h-10 bg-black/30 rounded-xl items-center justify-center border border-white/10 backdrop-blur-md">
              <Image source={require('../../assets/downlink.png')} className="w-6 h-6" resizeMode="contain" />
            </View>
            <Pressable className="w-10 h-10 rounded-full items-center justify-center bg-black/30 border border-white/10 backdrop-blur-md" onPress={() => router.push('/search' as any)}>
              <Search size={20} color="white" />
            </Pressable>
          </SafeAreaView>

          {/* Hero Content */}
          <View className="absolute bottom-0 w-full px-6 pb-6 items-center">
            <Text className="text-white text-3xl font-extrabold text-center tracking-tight mb-2">Avatar: The Way of Water</Text>
            <Text className="text-slate-300 text-xs font-medium text-center mb-6 tracking-wider uppercase">Action • Sci-Fi • Adventure</Text>
            
            <View className="flex-row gap-4 w-full">
              <Pressable 
                className="flex-1 bg-white h-12 rounded-full flex-row items-center justify-center"
                onPress={() => router.push('/player?id=featured')}
              >
                <Play size={20} color="black" fill="black" className="mr-2" />
                <Text className="text-black font-bold text-[15px]">Play</Text>
              </Pressable>
              
              <Pressable 
                className="flex-1 bg-white/20 border border-white/20 h-12 rounded-full flex-row items-center justify-center backdrop-blur-md"
              >
                <Info size={20} color="white" className="mr-2" />
                <Text className="text-white font-bold text-[15px]">Details</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content Rows */}
        <View className="mt-6">
          {renderMovieRow('Trending Now', TRENDING_MOVIES)}
          {renderMovieRow('New Releases', NEW_RELEASES)}
          {renderMovieRow('Popular on Provider', [...TRENDING_MOVIES].reverse())}
        </View>

      </ScrollView>
    </View>
  );
}
