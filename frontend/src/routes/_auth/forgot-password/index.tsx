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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
// import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { toast } from 'sonner';
import { useState } from 'react';

import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForgotPasswordMutation } from '@/store/api/Services/authApi';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();
  const [forgotPassword] = useForgotPasswordMutation();

  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onForgotPassword(data: ForgotPasswordValues) {
    try {
      setIsResettingPassword(true);
      const response = await forgotPassword({ email: data.email }).unwrap();

      if (response.success) {
        setResetEmail(data.email);
        setShowEmailDialog(true);
        toast.success('Password reset email sent successfully!');
      }
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error(
        error?.data?.message || 'Failed to send reset email. Please try again.'
      );
    } finally {
      setIsResettingPassword(false);
    }
  }

  const handleEmailDialogClose = () => {
    setShowEmailDialog(false);
    navigate({ to: '/login' });
  };

  return (
    <>
      <Form {...forgotPasswordForm}>
        <form
          onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)}
          className={cn('space-y-4', className)}
          {...props}
        >
          <FormField
            control={forgotPasswordForm.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='Enter your email address'
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
                Sending reset email...
              </>
            ) : (
              'Send Reset Email'
            )}
          </Button>
        </form>
      </Form>

      {/* Email Check Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
              <Mail className='h-8 w-8 text-blue-600' />
            </div>
            <DialogTitle className='text-2xl font-bold text-gray-900'>
              Check Your Email
            </DialogTitle>
            <DialogDescription className='text-gray-600 mt-2'>
              We've sent a password reset link to
            </DialogDescription>
            <div className='mt-2 text-sm font-medium text-gray-900'>
              {resetEmail}
            </div>
          </DialogHeader>

          <div className='mt-6 space-y-4'>
            <div className='rounded-lg bg-blue-50 p-4'>
              <div className='flex items-start'>
                <CheckCircle className='h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0' />
                <div className='text-sm text-blue-800'>
                  <p className='font-medium'>What's next?</p>
                  <ul className='mt-2 space-y-1'>
                    <li>• Check your email inbox (and spam folder)</li>
                    <li>• Click the password reset link in the email</li>
                    <li>• Create a new password for your account</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='flex flex-col space-y-3'>
              <Button onClick={handleEmailDialogClose} className='w-full'>
                Back to Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
