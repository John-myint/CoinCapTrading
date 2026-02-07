import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 bg-background"><div className="text-gray-400">Loading...</div></div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
