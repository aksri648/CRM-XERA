import { SignIn } from '@clerk/react';
import { useLocation } from 'react-router-dom';

export default function SignInPage() {
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e6faf7' }}>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={from}
        fallbackRedirectUrl={from}
      />
    </div>
  );
}
