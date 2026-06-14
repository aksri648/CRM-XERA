import { SignUp } from '@clerk/react';
import { useLocation } from 'react-router-dom';

export default function SignUpPage() {
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e6faf7' }}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl={from}
        fallbackRedirectUrl={from}
      />
    </div>
  );
}
