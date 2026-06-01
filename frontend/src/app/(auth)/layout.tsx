import { AuthProvider } from '@/components/auth-provider';
import QueryProvider from '@/components/query-provider';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}