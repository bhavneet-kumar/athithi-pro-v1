import { DollarSign, IndianRupee } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { Currency } from '@/lib/store/settingsStore';
import { useSettingsStore } from '@/lib/store/settingsStore';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useSettingsStore();

  const currencies: {
    value: Currency;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'USD',
      label: 'USD',
      icon: <DollarSign className='h-4 w-4' />,
    },
    {
      value: 'INR',
      label: 'INR',
      icon: <IndianRupee className='h-4 w-4' />,
    },
  ];

  const activeCurrency = currencies.find(c => c.value === currency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-9 w-9'>
          {activeCurrency?.icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {currencies.map(c => (
          <DropdownMenuItem
            key={c.value}
            onClick={() => setCurrency(c.value)}
            className='flex items-center gap-2'
          >
            {c.icon}
            <span>{c.label}</span>
            {c.value === currency && (
              <span className='ml-auto h-1.5 w-1.5 fill-current bg-foreground rounded-full'></span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
