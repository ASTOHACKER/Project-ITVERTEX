import { useState, useEffect } from 'react';
import { colorScheme as nwColorScheme } from 'nativewind';
import { useColorScheme as useRNColorScheme, Appearance } from 'react-native';

type Scheme = 'light' | 'dark' | 'system';

let globalScheme: Scheme = 'system';
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(l => l());
}

export function useColorScheme() {
  const rnColorScheme = useRNColorScheme();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleUpdate = () => forceUpdate({});
    listeners.add(handleUpdate);

    const subscription = Appearance.addChangeListener(() => {
      handleUpdate();
    });

    return () => {
      listeners.delete(handleUpdate);
      subscription.remove();
    };
  }, []);

  const setColorScheme = (scheme: Scheme) => {
    globalScheme = scheme;
    try {
      if (nwColorScheme && typeof nwColorScheme.set === 'function') {
        nwColorScheme.set(scheme);
      }
      Appearance.setColorScheme(scheme === 'system' ? null : scheme);
    } catch (e) {
      console.warn('Color scheme set error:', e);
    }
    notifyListeners();
  };

  const toggleColorScheme = () => {
    const active = getActiveScheme();
    setColorScheme(active === 'dark' ? 'light' : 'dark');
  };

  const getActiveScheme = (): 'light' | 'dark' => {
    if (globalScheme === 'dark') return 'dark';
    if (globalScheme === 'light') return 'light';
    const nwVal = nwColorScheme && typeof nwColorScheme.get === 'function' ? nwColorScheme.get() : undefined;
    if (nwVal === 'dark' || nwVal === 'light') return nwVal;
    return rnColorScheme === 'dark' ? 'dark' : 'light';
  };

  const active = getActiveScheme();

  return {
    colorScheme: globalScheme,
    activeColorScheme: active,
    isDark: active === 'dark',
    setColorScheme,
    toggleColorScheme,
  };
}

