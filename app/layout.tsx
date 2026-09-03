import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MYCO — Private Wealth Concierge',
  description: 'Asset Management & Private Wealth Control Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}