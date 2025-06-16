import React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { Language } from '@/lib/store/settingsStore';
import { useSettingsStore } from '@/lib/store/settingsStore';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useSettingsStore();

  const languages: { value: Language; label: string; flag: string }[] = [
    {
      value: 'EN',
      label: 'English',
      flag: '🇺🇸',
    },
    {
      value: 'HI',
      label: 'हिंदी',
      flag: '🇮🇳',
    },
  ];

  const activeLanguage = languages.find(l => l.value === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='h-9 px-2'>
          {activeLanguage?.flag} {activeLanguage?.value}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className='flex items-center gap-2'
          >
            <span className='mr-1'>{lang.flag}</span>
            <span>{lang.label}</span>
            {lang.value === language && (
              <span className='ml-auto h-1.5 w-1.5 fill-current bg-foreground rounded-full'></span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
