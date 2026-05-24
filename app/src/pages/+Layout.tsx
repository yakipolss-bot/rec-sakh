import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../services/auth-context';
import { CityProvider } from '../contexts/CityContext';
import Navbar from '../components/Navbar';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CityProvider>
          <Navbar />
          <main style={{ paddingTop: '5.5rem' }}>
            {children}
          </main>
        </CityProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
