import { SignIn } from '@clerk/react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e6faf7' }}>
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
