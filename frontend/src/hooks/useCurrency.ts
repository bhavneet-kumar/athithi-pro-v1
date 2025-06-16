import type { Currency } from '@/lib/store/settingsStore';
import { useSettingsStore } from '@/lib/store/settingsStore';

export const useCurrency = () => {
  const { currency } = useSettingsStore();

  // Convert between currencies if needed (simplified version)
  const convert = (amount: number, from: Currency, to: Currency): number => {
    if (from === to) {
      return amount;
    }

    // Simple conversion rates (in reality, would use API)
    const rates = {
      USD_TO_INR: 75,
      INR_TO_USD: 1 / 75,
    };

    if (from === 'USD' && to === 'INR') {
      return amount * rates.USD_TO_INR;
    } else if (from === 'INR' && to === 'USD') {
      return amount * rates.INR_TO_USD;
    }

    return amount;
  };

  // Format based on selected currency
  const formatCurrency = (amount: number): string => {
    if (!amount && amount !== 0) {
      return '';
    }

    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  // Currency symbol helper
  const getCurrencySymbol = (): string => {
    return currency === 'USD' ? '$' : '₹';
  };

  // Get the currency icon name (for Lucide icons)
  const getCurrencyIconName = (): string => {
    return currency === 'USD' ? 'dollar-sign' : 'indian-rupee';
  };

  return {
    currency,
    formatCurrency,
    convert,
    getCurrencySymbol,
    getCurrencyIconName,
  };
};
