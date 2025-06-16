// import { AppLogo } from "@/components/shared/app-logo.component";
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
// import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { toast } from 'sonner';
import { useState } from 'react';

import { Loader2 } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

const forgotPasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

const confirmResetPasswordSchema = z
  .object({
    code: z.string().min(1, 'Reset code is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ConfirmResetPasswordValues = z.infer<typeof confirmResetPasswordSchema>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
    },
  });

  const confirmResetForm = useForm<ConfirmResetPasswordValues>({
    resolver: zodResolver(confirmResetPasswordSchema),
    defaultValues: {
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onForgotPassword(data: ForgotPasswordValues) {
    try {
      setIsResettingPassword(true);
      // const { nextStep } = await resetPassword({
      //   username: data.username,
      // });

      // if (nextStep.resetPasswordStep === "CONFIRM_RESET_PASSWORD_WITH_CODE") {
      //   toast.success("Reset code sent to your email!");
      //   setUsername(data.username);
      //   setShowConfirmReset(true);
      // }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send reset code. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function onConfirmReset(data: ConfirmResetPasswordValues) {}

  return (
    <div className='flex flex-col gap-6'>
      {!showConfirmReset ? (
        <Form {...forgotPasswordForm}>
          <form
            onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)}
            className={cn('space-y-4', className)}
            {...props}
          >
            <FormField
              control={forgotPasswordForm.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter your username'
                      {...field}
                      disabled={isResettingPassword}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='w-full'
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending reset code...
                </>
              ) : (
                'Send Reset Code'
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...confirmResetForm}>
          <form
            onSubmit={confirmResetForm.handleSubmit(onConfirmReset)}
            className={cn('space-y-4', className)}
            {...props}
          >
            <FormField
              control={confirmResetForm.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter the code sent to your email'
                      {...field}
                      disabled={isConfirmingReset}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={confirmResetForm.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Enter your new password'
                      {...field}
                      disabled={isConfirmingReset}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={confirmResetForm.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Confirm your new password'
                      {...field}
                      disabled={isConfirmingReset}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='w-full'
              disabled={isConfirmingReset}
            >
              {isConfirmingReset ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}

export const ForgotPasswordScreen = ({
  setCurrentAuthStep,
}: {
  setCurrentAuthStep: (
    currentAuthStep: 'login' | 'register' | 'forgot-password' | 'confirm-mail'
  ) => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className='bg-white p-4 grid min-h-svh lg:grid-cols-2'>
      <div className='flex w-full justify-center items-center flex-col gap-4 p-6 md:p-10'>
        <div className='flex w-full flex-col justify-center gap-8'>
          {/* <AppLogo /> */}
          <h1 className='font-normal text-2xl leading-8'>Reset Password</h1>
        </div>
        <div className='flex flex-col w-full'>
          <ForgotPasswordForm className='w-full' />
          <Button
            variant='link'
            className='w-full cursor-pointer'
            onClick={() => navigate({ to: '/login' })}
          >
            Already have an account? Sign in
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

export const Route = createFileRoute('/_auth/forgot-password/')({
  component: ForgotPasswordScreen,
});
