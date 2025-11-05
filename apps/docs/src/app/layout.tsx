import '../styles/globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-primary">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-brand">Cerberix Docs</h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}


