import SEOHead from '@/components/SEOHead';
import BreakingTicker from '@/components/BreakingTicker';
import MostReadSidebar from '@/components/MostReadSidebar';
import WeatherWidget from '@/components/WeatherWidget';
import CurrencyWidget from '@/components/CurrencyWidget';
import EventsWidget from '@/components/EventsWidget';
import HeroSection from '@/components/sections/HeroSection';
import NewsFeedSection from '@/components/sections/NewsFeedSection';
import VideoSection from '@/components/sections/VideoSection';
import PhotoSection from '@/components/sections/PhotoSection';
import PollSection from '@/components/sections/PollSection';
import CategorySections from '@/components/sections/CategorySections';
import ThemeSection from '@/components/sections/ThemeSection';

export default function HomePage() {
  return (
    <>
      <SEOHead />
      <BreakingTicker />
      <div className="pt-20 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <HeroSection />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            <section className="lg:col-span-8" aria-label="Лента новостей">
              <NewsFeedSection />
            </section>
            <aside className="lg:col-span-4 space-y-4" aria-label="Боковая панель">
              <WeatherWidget />
              <CurrencyWidget />
              <EventsWidget />
              <MostReadSidebar />
            </aside>
          </div>

          <VideoSection />
          <PhotoSection />
          <PollSection />
          <CategorySections />
          <ThemeSection />
        </div>
      </div>
    </>
  );
}
