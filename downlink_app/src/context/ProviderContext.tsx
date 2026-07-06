import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProviderContextType = {
  providerUrl: string | null;
  isLoading: boolean;
  setProvider: (url: string) => Promise<void>;
  clearProvider: () => Promise<void>;
};

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [providerUrl, setProviderUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProvider();
  }, []);

  const loadProvider = async () => {
    try {
      const url = await AsyncStorage.getItem('PROVIDER_URL');
      if (url) {
        setProviderUrl(url);
      }
    } catch (e) {
      console.error('Failed to load provider URL', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setProvider = async (url: string) => {
    try {
      await AsyncStorage.setItem('PROVIDER_URL', url);
      setProviderUrl(url);
    } catch (e) {
      console.error('Failed to save provider URL', e);
    }
  };

  const clearProvider = async () => {
    try {
      await AsyncStorage.removeItem('PROVIDER_URL');
      setProviderUrl(null);
    } catch (e) {
      console.error('Failed to clear provider URL', e);
    }
  };

  return (
    <ProviderContext.Provider value={{ providerUrl, isLoading, setProvider, clearProvider }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return context;
}
