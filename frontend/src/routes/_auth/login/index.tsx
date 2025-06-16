import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';
import { z } from 'zod';

const loginFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({
  className,
  setCurrentAuthStep,
  ...props
}: React.ComponentProps<'form'> & {
  setCurrentAuthStep: (
    currentAuthStep: 'login' | 'register' | 'forgot-password' | 'confirm-mail'
  ) => void;
}) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      // setIsSigningIn(true);
      // const { isSignedIn, nextStep } = await signIn({
      //   username: data.username,
      //   password: data.password,
      // });
      // if (isSignedIn) {
      //   toast.success("Successfully signed in!");
      navigate({ to: '/crm' });
      // } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
      //   setCurrentAuthStep("confirm-mail");
      //   toast.error("Please confirm your email address first");
      // } else if (nextStep.signInStep === "RESET_PASSWORD") {
      //   toast.error("Please reset your password");
      // }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please check your credentials.');
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('flex flex-col gap-6', className)}
        {...props}
      >
        <div className='grid gap-6'>
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                  Username
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter your username'
                    {...field}
                    disabled={isSigningIn}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='********'
                    type='password'
                    {...field}
                    disabled={isSigningIn}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex flex-col gap-2'>
            <Button
              type='submit'
              className='bg-black text-white cursor-pointer w-full'
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            <Button
              onClick={() => navigate({ to: '/forgot-password' })}
              variant='link'
              className='w-full cursor-pointer'
              disabled={isSigningIn}
            >
              Forgot Password?
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export const LoginScreen = ({
  setCurrentAuthStep,
}: {
  navigate: (path: string) => void;
  setCurrentAuthStep: (
    currentAuthStep: 'login' | 'register' | 'forgot-password' | 'confirm-mail'
  ) => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className='bg-white p-4 grid min-h-svh lg:grid-cols-2'>
      <div className='flex w-full justify-center items-center flex-col gap-4 p-6 md:p-10'>
        <div className='flex w-full flex-col justify-center gap-8 '>
          {/* <AppLogo /> */}

          <h1 className='font-normal text-2xl leading-8'>Sign in</h1>
        </div>
        <div className='flex flex-col w-full'>
          <LoginForm
            className='w-full'
            setCurrentAuthStep={setCurrentAuthStep}
          />
          <Button
            variant='link'
            className='w-full cursor-pointer'
            onClick={() => {
              navigate({ to: '/registration' });
            }}
          >
            Don't have an account? Sign up
          </Button>
        </div>
      </div>
      <div className='bg-muted relative hidden lg:block'>
        <img
          src='/Modern-Medical-Office.png'
          alt='Image'
          className='absolute rounded-3xl inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
        />
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_auth/login/')({
  component: LoginScreen,
});
