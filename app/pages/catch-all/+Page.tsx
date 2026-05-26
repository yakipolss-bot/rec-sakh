import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import HomePage from '../../src/pages/HomePage';
import AdsPage from '../../src/pages/AdsPage';
import AdDetailPage from '../../src/pages/AdDetailPage';
import AdSubmitPage from '../../src/pages/AdSubmitPage';
import WeatherPage from '../../src/pages/WeatherPage';
import TransportPage from '../../src/pages/TransportPage';
import CurrencyPage from '../../src/pages/CurrencyPage';
import EventsPage from '../../src/pages/EventsPage';
import EventDetailPage from '../../src/pages/EventDetailPage';
import EventSubmitPage from '../../src/pages/EventSubmitPage';
import JobsPage from '../../src/pages/JobsPage';
import TvPage from '../../src/pages/TvPage';
import CrosswordsPage from '../../src/pages/CrosswordsPage';
import HoroscopePage from '../../src/pages/HoroscopePage';
import DirectoryPage from '../../src/pages/DirectoryPage';
import MediaPage from '../../src/pages/MediaPage';
import RealtyPage from '../../src/pages/RealtyPage';
import AboutPages from '../../src/pages/AboutPages';
import ArticlePage from '../../src/pages/ArticlePage';
import CategoryPage from '../../src/pages/CategoryPage';
import SearchPage from '../../src/pages/SearchPage';
import AccountPage from '../../src/pages/AccountPage';
import AuthPage from '../../src/pages/AuthPage';
import AccountLayout from '../../src/components/AccountLayout';
import AccountDashboard from '../../src/pages/account/index';
import AccountProfile from '../../src/pages/account/profile';
import AccountSecurity from '../../src/pages/account/security';
import AccountNotifications from '../../src/pages/account/notifications';
import AccountPrivacy from '../../src/pages/account/privacy';
import AccountComments from '../../src/pages/account/comments';
import AccountAds from '../../src/pages/account/ads';
import AccountJobs from '../../src/pages/account/jobs';
import AccountEvents from '../../src/pages/account/events';
import AccountSubscriptions from '../../src/pages/account/subscriptions';
import AccountFavorites from '../../src/pages/account/favorites';
import AccountBilling from '../../src/pages/account/billing';
import AccountSupport from '../../src/pages/account/support';
import AdminLayout from '../../src/pages/admin/AdminLayout';
import AdminDashboard from '../../src/pages/admin/index';
import AdminUsers from '../../src/pages/admin/users';
import AdminUserId from '../../src/pages/admin/users-id';
import AdminUsersRoles from '../../src/pages/admin/users-roles';
import AdminStaff from '../../src/pages/admin/staff';
import AdminModeration from '../../src/pages/admin/moderation';
import AdminContent from '../../src/pages/admin/content';
import AdminAdvertising from '../../src/pages/admin/advertising';
import AdminBilling from '../../src/pages/admin/billing';
import AdminSettings from '../../src/pages/admin/settings';
import AdminSystem from '../../src/pages/admin/system';
import AdminNews from '../../src/pages/admin/news';
import AdminComments from '../../src/pages/admin/comments';
import AdminCategories from '../../src/pages/admin/categories';
import AdminMedia from '../../src/pages/admin/media';
import EditorialLayout from '../../src/pages/editorial/EditorialLayout';
import EditorialDashboard from '../../src/pages/editorial/EditorialDashboard';
import EditorialNews from '../../src/pages/editorial/EditorialNews';
import EditorialNewsCreate from '../../src/pages/editorial/EditorialNewsCreate';
import EditorialNewsEdit from '../../src/pages/editorial/EditorialNewsEdit';
import EditorialNewsPreview from '../../src/pages/editorial/EditorialNewsPreview';
import EditorialNewsList from '../../src/pages/editorial/EditorialNewsList';
import EditorialNewsStats from '../../src/pages/editorial/EditorialNewsStats';
import EditorialNewsHistory from '../../src/pages/editorial/EditorialNewsHistory';
import EditorialNewsComments from '../../src/pages/editorial/EditorialNewsComments';
import EditorialCategories from '../../src/pages/editorial/EditorialCategories';
import EditorialTags from '../../src/pages/editorial/EditorialTags';
import EditorialMedia from '../../src/pages/editorial/EditorialMedia';
import EditorialComments from '../../src/pages/editorial/EditorialComments';
import EditorialAnalytics from '../../src/pages/editorial/EditorialAnalytics';
import EditorialSeo from '../../src/pages/editorial/EditorialSeo';
import EditorialAds from '../../src/pages/editorial/EditorialAds';
import EditorialEvents from '../../src/pages/editorial/EditorialEvents';
import EditorialNewsletters from '../../src/pages/editorial/EditorialNewsletters';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news/:id" element={<ArticlePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/about" element={<AboutPages />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/currency" element={<CurrencyPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/event/submit" element={<EventSubmitPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/ad/:id" element={<AdDetailPage />} />
          <Route path="/ad/submit" element={<AdSubmitPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/tv" element={<TvPage />} />
          <Route path="/crosswords" element={<CrosswordsPage />} />
          <Route path="/horoscope" element={<HoroscopePage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/realty" element={<RealtyPage />} />
          <Route path="/account-old" element={<AccountPage />} />

          <Route path="/account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
            <Route index element={<AccountDashboard />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="security" element={<AccountSecurity />} />
            <Route path="notifications" element={<AccountNotifications />} />
            <Route path="privacy" element={<AccountPrivacy />} />
            <Route path="comments" element={<AccountComments />} />
            <Route path="ads" element={<AccountAds />} />
            <Route path="jobs" element={<AccountJobs />} />
            <Route path="events" element={<AccountEvents />} />
            <Route path="subscriptions" element={<AccountSubscriptions />} />
            <Route path="favorites" element={<AccountFavorites />} />
            <Route path="billing" element={<AccountBilling />} />
            <Route path="support" element={<AccountSupport />} />
          </Route>

          <Route path="/editorial" element={<ProtectedRoute allowedRoles={['journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin']}><EditorialLayout /></ProtectedRoute>}>
            <Route index element={<EditorialDashboard />} />
            <Route path="news" element={<EditorialNews />}>
              <Route index element={<EditorialNewsList />} />
              <Route path="create" element={<EditorialNewsCreate />} />
              <Route path=":id/edit" element={<EditorialNewsEdit />} />
              <Route path=":id/preview" element={<EditorialNewsPreview />} />
              <Route path=":id/stats" element={<EditorialNewsStats />} />
              <Route path=":id/history" element={<EditorialNewsHistory />} />
              <Route path=":id/comments" element={<EditorialNewsComments />} />
            </Route>
            <Route path="categories" element={<EditorialCategories />} />
            <Route path="categories/:section" element={<EditorialCategories />} />
            <Route path="tags" element={<EditorialTags />} />
            <Route path="tags/:section" element={<EditorialTags />} />
            <Route path="media" element={<EditorialMedia />} />
            <Route path="media/:section" element={<EditorialMedia />} />
            <Route path="comments" element={<EditorialComments />} />
            <Route path="comments/:section" element={<EditorialComments />} />
            <Route path="analytics" element={<EditorialAnalytics />} />
            <Route path="analytics/:section" element={<EditorialAnalytics />} />
            <Route path="seo" element={<EditorialSeo />} />
            <Route path="seo/:section" element={<EditorialSeo />} />
            <Route path="ads" element={<EditorialAds />} />
            <Route path="ads/:section" element={<EditorialAds />} />
            <Route path="events" element={<EditorialEvents />} />
            <Route path="events/:section" element={<EditorialEvents />} />
            <Route path="newsletters" element={<EditorialNewsletters />} />
            <Route path="newsletters/:section" element={<EditorialNewsletters />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['chief_editor', 'moderator', 'admin', 'superadmin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserId />} />
            <Route path="users/roles" element={<AdminUsersRoles />} />
            <Route path="users/groups" element={<AdminUsers />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="staff/:section" element={<AdminStaff />} />
            <Route path="moderation" element={<AdminModeration />} />
            <Route path="moderation/:section" element={<AdminModeration />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="content/:section" element={<AdminContent />} />
            <Route path="advertising" element={<AdminAdvertising />} />
            <Route path="advertising/:section" element={<AdminAdvertising />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="billing/:section" element={<AdminBilling />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="settings/:section" element={<AdminSettings />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="system" element={<AdminSystem />} />
            <Route path="system/:section" element={<AdminSystem />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CatchAllPage() {
  return <AnimatedRoutes />;
}
