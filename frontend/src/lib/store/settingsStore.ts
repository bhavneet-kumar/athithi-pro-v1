import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'INR';
export type Language = 'EN' | 'HI';

interface SettingsState {
  currency: Currency;
  language: Language;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      currency: 'USD',
      language: 'EN',
      setCurrency: currency => set({ currency }),
      setLanguage: language => set({ language }),
    }),
    {
      name: 'settings-store',
    }
  )
);
