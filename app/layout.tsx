import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Myco Concierge - Asset Management',
  description: 'Private Real Estate Wealth Management',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-[#FDFDFB] text-[#1A1A1A] antialiased">
        {children}
      </body>
    </html>
  );
}