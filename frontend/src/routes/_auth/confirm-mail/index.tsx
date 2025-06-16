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
// import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createFileRoute } from '@tanstack/react-router';
const confirmationFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  code: z.string().min(1, 'Confirmation code is required'),
});

type ConfirmationFormValues = z.infer<typeof confirmationFormSchema>;

export function ConfirmationForm({
  className,
  onSuccess,
  ...props
}: React.ComponentProps<'form'> & {
  onSuccess: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const form = useForm<ConfirmationFormValues>({
    resolver: zodResolver(confirmationFormSchema),
    defaultValues: {
      username: '',
      code: '',
    },
  });

  async function handleResendCode() {
    // try {
    //   setIsResending(true);
    //   await resendSignUpCode({
    //     username: form.getValues("username"),
    //   });
    //   toast.success("Confirmation code resent successfully!");
    // } catch (error: any) {
    //   console.error("Error resending code:", error);
    //   toast.error("Failed to resend confirmation code. Please try again.");
    // } finally {
    //   setIsResending(false);
    // }
  }

  async function onSubmit(data: ConfirmationFormValues) {}

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
                    disabled={isConfirming || isResending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='code'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                  Confirmation Code
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter the code from your email'
                    {...field}
                    disabled={isConfirming || isResending}
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
              disabled={isConfirming || isResending}
            >
              {isConfirming ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Confirming...
                </>
              ) : (
                'Confirm Email'
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              className='w-full cursor-pointer'
              onClick={handleResendCode}
              disabled={isConfirming || isResending || !form.watch('username')}
            >
              {isResending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Resending...
                </>
              ) : (
                'Resend Code'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export const ConfirmMailScreen = ({
  setCurrentAuthStep,
}: {
  setCurrentAuthStep: (
    currentAuthStep: 'login' | 'register' | 'forgot-password' | 'confirm-mail'
  ) => void;
}) => {
  return (
    <div className='bg-white p-4 grid min-h-svh lg:grid-cols-2'>
      <div className='flex w-full justify-center items-center flex-col gap-8 p-6 md:p-10'>
        <div className='flex w-full flex-col justify-center gap-8 '>
          {/* <AppLogo /> */}

          <div className='flex flex-col gap-2'>
            <h1 className='font-normal text-3xl leading-9'>
              Let's setup your account
            </h1>
            <p className='font-normal text-sm leading-5 tracking-[0.25px] text-[#49454E]'>
              Setting up your profile is quick and easy, and its the first step
              towards accessing all the features and benefits of WaitZeroes
            </p>
          </div>
        </div>
        <div className='flex flex-col w-full'>
          <ConfirmationForm
            className='w-full'
            onSuccess={() => setCurrentAuthStep('login')}
          />
          <Button
            variant='link'
            className='w-full cursor-pointer'
            onClick={() => setCurrentAuthStep('login')}
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

export const Route = createFileRoute('/_auth/confirm-mail/')({
  component: ConfirmMailScreen,
});
