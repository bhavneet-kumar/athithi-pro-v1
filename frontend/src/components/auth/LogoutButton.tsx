import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LogoutButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export const LogoutButton = ({
  variant = 'ghost',
  size = 'default',
  className,
  children,
}: LogoutButtonProps) => {
  const { logout } = useAuth();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={logout}
    >
      <LogOut className='h-4 w-4 mr-2' />
      {children || 'Logout'}
    </Button>
  );
};
