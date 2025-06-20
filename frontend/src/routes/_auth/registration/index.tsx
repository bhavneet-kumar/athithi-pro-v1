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
import { createFileRoute, useNavigate } from '@tanstack/react-router';
// import { signUp } from "aws-amplify/auth";
import { Loader2, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useRegisterMutation,
  RegisterForm,
  AgencyInfo,
} from '@/store/api/Services/authApi';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schemas
const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .max(255, 'Email must not exceed 255 characters');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .trim()
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

const agencyNameSchema = z
  .string()
  .min(2, 'Agency name must be at least 2 characters')
  .max(100, 'Agency name must not exceed 100 characters')
  .trim();

const agencyCodeSchema = z
  .string()
  .min(3, 'Agency code must be at least 3 characters')
  .max(20, 'Agency code must not exceed 20 characters')
  .trim()
  .regex(
    /^[A-Z0-9]+$/,
    'Agency code can only contain uppercase letters and numbers'
  );

const domainSchema = z
  .string()
  .min(1, 'Domain is required')
  .max(255, 'Domain must not exceed 255 characters')
  .trim()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
    'Please enter a valid domain'
  );

const agencySettingsSchema = z.object({
  maxUsers: z
    .number()
    .min(1, 'Max users must be at least 1')
    .max(10000, 'Max users cannot exceed 10000'),
  allowedDomains: z
    .array(z.string().min(1, 'Domain cannot be empty'))
    .min(1, 'At least one allowed domain is required'),
  customBranding: z.object({
    logo: z.string().url('Please enter a valid logo URL'),
    colors: z.object({
      primary: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color'),
      secondary: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, 'Secondary color must be a valid hex color'),
    }),
  }),
});

const registrationFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.string(),
  agency: z.object({
    name: agencyNameSchema,
    code: agencyCodeSchema,
    domain: domainSchema,
    settings: agencySettingsSchema,
  }),
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
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [register] = useRegisterMutation();

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: '68501597642634bb747b7e48',
      agency: {
        name: '',
        code: '',
        domain: '',
        settings: {
          maxUsers: 200,
          allowedDomains: ['testagency.com'],
          customBranding: {
            logo: 'https://example.com/logo.png',
            colors: {
              primary: '#FF5722',
              secondary: '#4CAF50',
            },
          },
        },
      },
    },
  });

  async function onSubmit(data: RegistrationFormValues) {
    try {
      setIsRegistering(true);
      const registerData: RegisterForm = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        agency: {
          name: data.agency.name,
          code: data.agency.code,
          domain: data.agency.domain,
          settings: {
            maxUsers: data.agency.settings.maxUsers,
            allowedDomains: data.agency.settings.allowedDomains,
            customBranding: {
              logo: data.agency.settings.customBranding.logo,
              colors: {
                primary: data.agency.settings.customBranding.colors.primary,
                secondary: data.agency.settings.customBranding.colors.secondary,
              },
            },
          },
        },
      };
      const response = await register(registerData).unwrap();
      if (response.success) {
        setRegisteredEmail(data.email);
        setShowVerificationDialog(true);
        toast.success(
          'Registration successful! Please check your email to confirm your account.'
        );
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error(
        error.data?.message || 'Failed to register. Please try again.'
      );
    } finally {
      setIsRegistering(false);
    }
  }

  const handleVerificationDialogClose = () => {
    setShowVerificationDialog(false);
    setCurrentAuthStep('confirm-mail');
  };

  return (
    <>
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
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                    First Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter your first name'
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
              name='lastName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter your last name'
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

            {/* Agency Information Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-[#1E1E1E]'>
                Agency Information
              </h3>

              <FormField
                control={form.control}
                name='agency.name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                      Agency Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter agency name'
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
                name='agency.code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                      Agency Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter agency code (e.g., TEST123)'
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
                name='agency.domain'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                      Agency Domain
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter agency domain (e.g., testagency.com)'
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
                name='agency.settings.maxUsers'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                      Maximum Users
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter maximum number of users'
                        {...field}
                        onChange={e =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isRegistering}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='agency.settings.allowedDomains.0'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                      Allowed Domain
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter allowed domain (e.g., testagency.com)'
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
                name='agency.settings.customBranding.logo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                      Logo URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='url'
                        placeholder='Enter logo URL'
                        {...field}
                        disabled={isRegistering}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='agency.settings.customBranding.colors.primary'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                        Primary Color
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='color'
                          {...field}
                          disabled={isRegistering}
                          className='h-12'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='agency.settings.customBranding.colors.secondary'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[#1E1E1E] text-base font-normal'>
                        Secondary Color
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='color'
                          {...field}
                          disabled={isRegistering}
                          className='h-12'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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

      {/* Email Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
              <CheckCircle className='h-8 w-8 text-green-600' />
            </div>
            <DialogTitle className='text-2xl font-bold text-gray-900'>
              Check Your Email
            </DialogTitle>
            <DialogDescription className='text-gray-600 mt-2'>
              We've sent a verification link to
            </DialogDescription>
            <div className='mt-2 text-sm font-medium text-gray-900'>
              {registeredEmail}
            </div>
          </DialogHeader>

          <div className='mt-6 space-y-4'>
            <div className='rounded-lg bg-blue-50 p-4'>
              <div className='flex items-start'>
                <Mail className='h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0' />
                <div className='text-sm text-blue-800'>
                  <p className='font-medium'>What's next?</p>
                  <ul className='mt-2 space-y-1'>
                    <li>• Check your email inbox (and spam folder)</li>
                    <li>• Click the verification link in the email</li>
                    <li>• Complete your account setup</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='flex flex-col space-y-3'>
              <Button
                variant='outline'
                onClick={() => navigate({ to: '/login' })}
                className='w-full'
              >
                Back to Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
              towards accessing all the features and benefits of AthitiPro.
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
