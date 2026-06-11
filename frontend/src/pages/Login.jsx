import { useAuth, useSignIn } from '@clerk/clerk-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";

export default function Login() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoaded) return <div className="min-h-screen bg-[#0f1923] flex items-center justify-center"><p className="text-white">Loading...</p></div>;
  if (isSignedIn) return <Navigate to="/" replace />;

  const handleGoogleSignIn = async () => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.origin,
        redirectUrlComplete: window.location.origin,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Google sign in failed');
    }
  };

  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [signInIdentifier, setSignInIdentifier] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email });
      if (result.status === 'needs_first_factor') {
        const factor = result.supportedFirstFactors.find(f => f.strategy === 'email_code');
        if (factor) {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
          setSignInIdentifier(result);
          setCodeSent(true);
        }
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || !signInIdentifier) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: verificationCode });
      if (result.status === 'complete') {
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1923] flex flex-col items-center justify-center p-4">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#0fd4b4] flex items-center justify-center">
          <span className="text-white font-bold text-2xl">X</span>
        </div>
        <span className="text-white text-3xl font-bold ml-3">Xeno AI</span>
      </div>
      <p className="text-slate-400 text-sm mb-8">Campaign Intelligence Platform</p>

      <div className="bg-white rounded-2xl p-8 w-[420px] shadow-xl">
        <h1 className="text-xl font-semibold text-gray-900">Sign in to My Application</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Please sign in to continue</p>

        <Button variant="outline" className="w-full mt-6" onClick={handleGoogleSignIn}>
          <svg viewBox="0 0 24 24" width="20" height="20" className="mr-3"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {codeSent ? (
          <form onSubmit={handleVerifyCode}>
            <p className="text-sm text-gray-600 mb-4">Enter the 6-digit code sent to {email}</p>
            <Input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <Button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button variant="link" onClick={() => { setCodeSent(false); setEmail(''); setVerificationCode(''); }} className="w-full mt-2 text-gray-500 text-sm">
              Use a different email
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit}>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800"
            >
              {loading ? 'Please wait...' : 'Continue ▶'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Button variant="link" className="text-[#0fd4b4] p-0 h-auto font-medium">
            Sign up
          </Button>
        </p>
      </div>
    </div>
  );
}
