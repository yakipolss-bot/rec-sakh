import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/hooks/useTheme';
import { FavoritesProvider } from '../src/hooks/useFavorites';
import { CityProvider } from '../src/contexts/CityContext';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import ScrollProgress from '../src/components/ScrollProgress';
import { AuthProvider } from '../src/services/auth-context';
import SEOHead from '../src/components/SEOHead';
import ErrorBoundary from '../src/components/ErrorBoundary';
import '../src/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <ThemeProvider>
      <FavoritesProvider>
        <CityProvider>
          <SEOHead />
          <ScrollProgress />
          <Navbar />
          <main className="min-h-screen">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <Footer />
        </CityProvider>
      </FavoritesProvider>
    </ThemeProvider>
    </AuthProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
}
