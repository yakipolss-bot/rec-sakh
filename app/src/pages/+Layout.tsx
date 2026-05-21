import { AuthProvider } from '../services/auth-context';
import Navbar from '../components/Navbar';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main style={{ paddingTop: '5.5rem' }}>
        {children}
      </main>
    </AuthProvider>
  );
}
