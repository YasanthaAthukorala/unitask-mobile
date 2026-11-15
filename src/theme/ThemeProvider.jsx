import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { getDb } from '../database/database';
import { palettes } from '../constants/theme';
import { readThemePreference, writeThemePreference } from './preferences';

function useThemeState() {
  const systemScheme = useColorScheme();
  const [preference,setPreference] = useState('system');
  const [ready,setReady] = useState(false),[error,setError] = useState(''),[attempt,setAttempt] = useState(0);
  const [saving,setSaving] = useState(false),[preferenceError,setPreferenceError] = useState('');
  const savingRef = useRef(false);
  /** @type {'light' | 'dark'} */
  const scheme = preference === 'dark' || (preference === 'system' && systemScheme === 'dark') ? 'dark' : 'light';
  const colors = palettes[scheme];

  useEffect(() => {
    let active = true;
    getDb().then(readThemePreference).then(value => {
      if (active) { setPreference(value);setReady(true); }
    }).catch(() => { if (active) setError('Local storage could not start. Please retry.'); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(preference === 'system' ? 'auto' : scheme);
    else document.documentElement.style.colorScheme = scheme;
    // The React root and all screens also paint this color if a host does not support the API.
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background,preference,scheme]);

  const retry = useCallback(() => {setReady(false);setError('');setAttempt(value => value + 1);}, []);
  const changePreference = useCallback(async value => {
    if (savingRef.current) return;
    savingRef.current = true;setSaving(true);setPreferenceError('');
    try {
      await writeThemePreference(await getDb(),value);
      setPreference(value);
    } catch {
      setPreferenceError('Could not save appearance. Please try again.');
    } finally {
      savingRef.current = false;setSaving(false);
    }
  }, []);
  return useMemo(() => ({colors,scheme:/** @type {'light' | 'dark'} */ (scheme),preference,ready,error,retry,saving,preferenceError,changePreference}),
    [colors,scheme,preference,ready,error,retry,saving,preferenceError,changePreference]);
}
const ThemeContext = createContext(/** @type {ReturnType<typeof useThemeState> | null} */ (null));
export function AppThemeProvider({children}) {
  const theme = useThemeState();
  const navigationTheme = useMemo(() => {
    const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {...base,colors:{...base.colors,primary:theme.colors.primary,background:theme.colors.background,
      card:theme.colors.surface,text:theme.colors.text,border:theme.colors.border,notification:theme.colors.danger}};
  }, [theme.colors,theme.scheme]);
  return <ThemeContext.Provider value={theme}>
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'}/>
      {children}
    </NavigationThemeProvider>
  </ThemeContext.Provider>;
}
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('Theme components must be inside AppThemeProvider');
  return theme;
}
export function useThemeStyles(createStyles) {
  const {colors} = useTheme();
  return useMemo(() => createStyles(colors), [colors,createStyles]);
}
