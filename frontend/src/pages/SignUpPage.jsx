import { SignUp } from '@clerk/react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e6faf7' }}>
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
