import AppShell from '@/components/app-shell';
import QueryProvider from '@/components/query-provider';
import { AuthProvider } from '@/components/auth-provider';
import RealtimeProvider from '@/components/realtime-provider';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <AuthProvider>
        <RealtimeProvider>
          <AppShell>{children}</AppShell>
        </RealtimeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}