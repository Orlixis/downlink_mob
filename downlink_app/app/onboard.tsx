import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Link2, ChevronRight, ShieldAlert } from 'lucide-react-native';
import { useProvider } from '../src/context/ProviderContext';
import * as Haptics from 'expo-haptics';

export default function OnboardScreen() {
  const [url, setUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const { setProvider } = useProvider();

  const handleConnect = async () => {
    if (!url.trim()) {
      setError('Please enter a valid connection string');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // In a real app, you would validate the URL here by hitting a /health or /verify endpoint
    // For now, we will just simulate a quick connection process
    setIsConnecting(true);
    setError('');
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setProvider(url.trim());
    } catch (e) {
      setError('Failed to connect to provider. Please check the URL.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f172a]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        <View className="mb-10 items-center">
          <View className="w-20 h-20 bg-slate-800 rounded-[24px] items-center justify-center border border-white/5 shadow-2xl mb-6">
            <Link2 size={40} color="#38bdf8" />
          </View>
          <Text className="text-3xl font-extrabold text-slate-50 text-center tracking-tight mb-3">
            Link Provider
          </Text>
          <Text className="text-slate-400 text-[15px] font-medium text-center px-4 leading-relaxed">
            Downlink requires a content provider string to function. Enter your provider URL below to sync your library.
          </Text>
        </View>

        <View className="bg-slate-800/80 rounded-[24px] p-5 border border-slate-700/50 mb-6">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">
            Provider Connection String
          </Text>
          <View className="flex-row items-center bg-slate-900 rounded-2xl border border-slate-700 px-4 h-16">
            <Link2 size={20} color="#64748b" className="mr-3" />
            <TextInput
              className="flex-1 text-slate-50 text-[16px] font-medium"
              placeholder="https://api.example.com/v1"
              placeholderTextColor="#475569"
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!isConnecting}
            />
          </View>
          
          {error ? (
            <Text className="text-red-400 text-[13px] font-medium mt-3 ml-1">
              {error}
            </Text>
          ) : null}
        </View>

        <Pressable
          className={`h-16 rounded-2xl flex-row items-center justify-center overflow-hidden relative ${
            !url.trim() || isConnecting ? 'bg-slate-800' : 'bg-blue-600'
          }`}
          onPress={handleConnect}
          disabled={!url.trim() || isConnecting}
          style={!url.trim() || isConnecting ? {} : {
            shadowColor: '#2563eb', 
            shadowOffset: { width: 0, height: 8 }, 
            shadowOpacity: 0.4, 
            shadowRadius: 16, 
            elevation: 8
          }}
        >
          {isConnecting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text className={`text-[17px] font-bold tracking-wide mr-2 ${
                !url.trim() ? 'text-slate-500' : 'text-white'
              }`}>
                Connect Provider
              </Text>
              <ChevronRight size={20} color={!url.trim() ? '#64748b' : '#ffffff'} />
            </>
          )}
        </Pressable>

        <View className="mt-12 flex-row items-start bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
          <ShieldAlert size={20} color="#94a3b8" className="mr-3 mt-0.5" />
          <Text className="flex-1 text-slate-400 text-[13px] leading-relaxed">
            Downlink is an independent media aggregator. We do not host, provide, or take responsibility for the content served by third-party provider strings.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
