import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { usePageContext } from 'vike-react/usePageContext';
import { ThemeProvider } from '../src/hooks/useTheme';
import { FavoritesProvider } from '../src/hooks/useFavorites';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';
import ScrollProgress from '../src/components/ScrollProgress';
import '../src/index.css';

function Router({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const url = pageContext.urlParsed.pathname + pageContext.urlParsed.search;
  return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Router>
      <ThemeProvider>
        <FavoritesProvider>
          <ScrollProgress />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </FavoritesProvider>
      </ThemeProvider>
    </Router>
  );
}
