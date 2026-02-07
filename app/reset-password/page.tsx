import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 bg-background"><div className="text-gray-400">Loading...</div></div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
