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
import { CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useResetPasswordMutation } from '@/store/api/Services/authApi';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordScreen = () => {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [resetPassword] = useResetPasswordMutation();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    try {
      setResetStatus('loading');
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }).unwrap();

      setResetStatus('success');
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      setResetStatus('error');
      toast.error(
        error?.data?.message || 'Password reset failed. Please try again.'
      );
    }
  };

  const handleGoToLogin = () => {
    navigate({ to: '/login' });
  };

  const handleGoToHome = () => {
    navigate({ to: '/' });
  };

  if (resetStatus === 'success') {
    return (
      <div className='bg-white p-4 grid min-h-svh lg:grid-cols-2'>
        <div className='flex w-full justify-center items-center flex-col gap-8 p-6 md:p-10'>
          <div className='flex w-full flex-col justify-center gap-8'>
            <div className='flex flex-col gap-2'>
              <h1 className='font-normal text-3xl leading-9'>Password Reset</h1>
              <p className='font-normal text-sm leading-5 tracking-[0.25px] text-[#49454E]'>
                Your password has been successfully reset
              </p>
            </div>
          </div>

          <div className='flex flex-col w-full items-center gap-6'>
            <div className='flex flex-col items-center gap-4'>
              <CheckCircle className='h-12 w-12 text-green-600' />
              <div className='text-center'>
                <h2 className='text-xl font-semibold text-green-600 mb-2'>
                  Success!
                </h2>
                <p className='text-gray-600 mb-6'>
                  Your password has been reset successfully. You can now sign in
                  with your new password.
                </p>
              </div>
              <div className='flex flex-col gap-3 w-full max-w-sm'>
                <Button
                  onClick={handleGoToLogin}
                  className='bg-black text-white cursor-pointer w-full'
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleGoToHome}
                  variant='outline'
                  className='w-full cursor-pointer'
                >
                  Go to Home
                </Button>
              </div>
            </div>
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
  }

  return (
    <div className='bg-white p-4 grid min-h-svh lg:grid-cols-2'>
      <div className='flex w-full justify-center items-center flex-col gap-8 p-6 md:p-10'>
        <div className='flex w-full flex-col justify-center gap-8'>
          <div className='flex flex-col gap-2'>
            <h1 className='font-normal text-3xl leading-9'>
              Reset Your Password
            </h1>
            <p className='font-normal text-sm leading-5 tracking-[0.25px] text-[#49454E]'>
              Enter your new password below to complete the reset process
            </p>
          </div>
        </div>

        <div className='flex flex-col w-full'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className={cn('flex flex-col gap-6 w-full')}
            >
              <div className='grid gap-6'>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Enter your new password'
                            {...field}
                            disabled={resetStatus === 'loading'}
                            className='pr-10'
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={resetStatus === 'loading'}
                          >
                            {showPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder='Confirm your new password'
                            {...field}
                            disabled={resetStatus === 'loading'}
                            className='pr-10'
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={resetStatus === 'loading'}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex flex-col gap-2'>
                  <Button
                    type='submit'
                    className='bg-black text-white cursor-pointer w-full'
                    disabled={resetStatus === 'loading'}
                  >
                    {resetStatus === 'loading' ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>

                  <Button
                    type='button'
                    variant='link'
                    className='w-full cursor-pointer'
                    onClick={handleGoToLogin}
                    disabled={resetStatus === 'loading'}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </form>
          </Form>
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

export const Route = createFileRoute('/_auth/reset-password/$token')({
  component: ResetPasswordScreen,
});
