import type { Metadata } from 'next';
import AppToaster from '@/components/app-toaster';
import { cn } from '@/lib/utils';
import './globals.css';

export const metadata: Metadata = {
  title: 'Issue Triage Dashboard',
  description: 'Mini issue triage tool for engineering teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        'font-sans',
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
