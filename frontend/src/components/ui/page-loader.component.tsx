import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export const PageLoader = ({ spinning }: { spinning: boolean }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let ptg = -10;

    const interval = setInterval(() => {
      ptg += 5;
      setPercent(ptg);

      if (ptg > 120) {
        clearInterval(interval);
        setPercent(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!spinning) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
      <div className='flex flex-col items-center gap-4'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <div className='text-sm text-muted-foreground'>
          Loading... {Math.min(percent, 100)}%
        </div>
      </div>
    </div>
  );
};
