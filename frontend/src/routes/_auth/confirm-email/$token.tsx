import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useVerifyEmailMutation } from '@/store/api/Services/authApi';
import { toast } from 'sonner';

export const ConfirmEmailScreen = () => {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [verifyEmail] = useVerifyEmailMutation();

  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        const response = await verifyEmail({ token }).unwrap();
        if (response.success) {
          setVerificationStatus('success');
          toast.success('Email verified successfully!');
        } else {
          setVerificationStatus('error');
          toast.error(
            response.message || 'Email verification failed. Please try again.'
          );
        }
      } catch (error: any) {
        console.error('Email verification failed:', error);
        setVerificationStatus('error');
        toast.error(
          error?.data?.message || 'Email verification failed. Please try again.'
        );
      }
    };

    if (token && token.trim() !== '') {
      verifyEmailToken();
    } else if (token === undefined) {
      setVerificationStatus('loading');
    } else {
      setVerificationStatus('error');
      toast.error('Invalid verification link');
    }
  }, [token, verifyEmail]);

  const handleGoToLogin = () => {
    navigate({ to: '/login' });
  };

  const handleGoToHome = () => {
    navigate({ to: '/' });
  };

  return (
    <div className='bg-white p-4 grid min-h-svh lg:grid-cols-2'>
      <div className='flex w-full justify-center items-center flex-col gap-8 p-6 md:p-10'>
        <div className='flex w-full flex-col justify-center gap-8'>
          <div className='flex flex-col gap-2'>
            <h1 className='font-normal text-3xl leading-9'>
              Email Verification
            </h1>
            <p className='font-normal text-sm leading-5 tracking-[0.25px] text-[#49454E]'>
              We're verifying your email address to complete your account setup
            </p>
          </div>
        </div>

        <div className='flex flex-col w-full items-center gap-6'>
          {verificationStatus === 'loading' && (
            <div className='flex flex-col items-center gap-4'>
              <Loader2 className='h-12 w-12 animate-spin text-blue-600' />
              <p className='text-center text-gray-600'>
                Verifying your email address...
              </p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className='flex flex-col items-center gap-4'>
              <CheckCircle className='h-12 w-12 text-green-600' />
              <div className='text-center'>
                <h2 className='text-xl font-semibold text-green-600 mb-2'>
                  Thank you!
                </h2>
                <p className='text-gray-600 mb-6'>
                  Your email has been verified successfully. You can now sign in
                  to your account.
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
          )}

          {verificationStatus === 'error' && (
            <div className='flex flex-col items-center gap-4'>
              <div className='h-12 w-12 rounded-full bg-red-100 flex items-center justify-center'>
                <span className='text-red-600 text-2xl'>!</span>
              </div>
              <div className='text-center'>
                <h2 className='text-xl font-semibold text-red-600 mb-2'>
                  Verification Failed
                </h2>
                <p className='text-gray-600 mb-6'>
                  The verification link is invalid or has expired. Please
                  request a new verification email.
                </p>
              </div>
              <div className='flex flex-col gap-3 w-full max-w-sm'>
                <Button
                  onClick={handleGoToLogin}
                  className='bg-black text-white cursor-pointer w-full'
                >
                  Go to Sign In
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
          )}
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

export const Route = createFileRoute('/_auth/confirm-email/$token')({
  component: ConfirmEmailScreen,
});
