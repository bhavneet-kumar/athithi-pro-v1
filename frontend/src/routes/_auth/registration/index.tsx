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
import { createFileRoute, useNavigate } from '@tanstack/react-router';
// import { signUp } from "aws-amplify/auth";
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from 'sonner';
import { z } from 'zod';

const registrationFormSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    username: z.string().min(1, 'Username is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export function RegistrationForm({
  className,
  setCurrentAuthStep,
  ...props
}: React.ComponentProps<'form'> & {
  setCurrentAuthStep: (
    currentAuthStep: 'login' | 'register' | 'forgot-password' | 'confirm-mail'
  ) => void;
}) {
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegistrationFormValues) {
    try {
      setIsRegistering(true);
      // const { isSignUpComplete, nextStep } = await signUp({
      //   username: data.username,
      //   password: data.password,
      //   options: {
      //     userAttributes: {
      //       email: data.email,
      //     },
      //     autoSignIn: true,
      //   },
      // });
      // if (isSignUpComplete) {
      //   toast.success(
      //     "Registration successful! Please check your email to confirm your account."
      //   );
      //   setCurrentAuthStep("confirm-mail");
      // } else if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
      //   setCurrentAuthStep("confirm-mail");
      //   toast.success(
      //     "Registration successful! Please check your email to confirm your account."
      //   );
      // }
    } catch (error: unknown) {
      console.error('Error registering:', error);
      if (error instanceof Error && error.name === 'UsernameExistsException') {
        toast.error(
          'Username already exists. Please choose a different username.'
        );
      } else if (
        error instanceof Error &&
        error.name === 'InvalidPasswordException'
      ) {
        toast.error('Password does not meet requirements. Please try again.');
      } else {
        toast.error('Failed to register. Please try again.');
      }
    } finally {
      setIsRegistering(false);
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
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter your email'
                    type='email'
                    {...field}
                    disabled={isRegistering}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    placeholder='Choose a username'
                    {...field}
                    disabled={isRegistering}
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
                    placeholder='Create a password'
                    type='password'
                    {...field}
                    disabled={isRegistering}
                  />
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
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Confirm your password'
                    type='password'
                    {...field}
                    disabled={isRegistering}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            className='bg-black text-white cursor-pointer w-full'
            disabled={isRegistering}
          >
            {isRegistering ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export const RegistrationScreen = ({
  setCurrentAuthStep,
}: {
  setCurrentAuthStep: (
    currentAuthStep: 'login' | 'register' | 'forgot-password' | 'confirm-mail'
  ) => void;
}) => {
  const navigate = useNavigate();
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
          <RegistrationForm
            className='w-full'
            setCurrentAuthStep={setCurrentAuthStep}
          />
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

export const Route = createFileRoute('/_auth/registration/')({
  component: RegistrationScreen,
});
