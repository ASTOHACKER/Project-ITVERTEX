import { useEffect, useState } from 'react';
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

    let observer: MutationObserver | null = null;
    if (typeof document !== 'undefined') {
      observer = new MutationObserver(() => {
        handleUpdate();
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    return () => {
      listeners.delete(handleUpdate);
      if (observer) observer.disconnect();
    };
  }, []);

  const setColorScheme = (scheme: Scheme) => {
    globalScheme = scheme;
    try {
      if (nwColorScheme && typeof nwColorScheme.set === 'function') {
        nwColorScheme.set(scheme);
      }
      if (typeof document !== 'undefined') {
        if (scheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (scheme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          if (rnColorScheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
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
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
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

