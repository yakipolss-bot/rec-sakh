import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/hooks/useTheme';
import { FavoritesProvider } from '../src/hooks/useFavorites';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import ScrollProgress from '../src/components/ScrollProgress';
import '../src/index.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <ScrollProgress />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
