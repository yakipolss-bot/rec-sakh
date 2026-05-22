import React, { useEffect } from 'react';
import { ThemeProvider } from '../src/hooks/useTheme';
import { FavoritesProvider } from '../src/hooks/useFavorites';
import { CityProvider } from '../src/contexts/CityContext';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import ScrollProgress from '../src/components/ScrollProgress';
import { authService } from '../src/services/auth.service';
import { AuthProvider } from '../src/services/auth-context';
import '../src/index.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    authService.getSession();
    const subscription = authService.onAuthStateChange(() => {});
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  return (
    <AuthProvider>
    <ThemeProvider>
      <FavoritesProvider>
        <CityProvider>
          <ScrollProgress />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </CityProvider>
      </FavoritesProvider>
    </ThemeProvider>
    </AuthProvider>
  );
}
