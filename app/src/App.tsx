import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';
import HomePage from '@/pages/HomePage';
import ArticlePage from '@/pages/ArticlePage';
import CategoryPage from '@/pages/CategoryPage';
import SearchPage from '@/pages/SearchPage';
import AccountPage from '@/pages/AccountPage';
import AuthPage from '@/pages/AuthPage';
import AccountLayout from '@/components/AccountLayout';
import AccountDashboard from '@/pages/account/index';
import AccountProfile from '@/pages/account/profile';
import AccountSecurity from '@/pages/account/security';
import AccountNotifications from '@/pages/account/notifications';
import AccountPrivacy from '@/pages/account/privacy';
import AccountComments from '@/pages/account/comments';
import AccountAds from '@/pages/account/ads';
import AccountJobs from '@/pages/account/jobs';
import AccountEvents from '@/pages/account/events';
import AccountSubscriptions from '@/pages/account/subscriptions';
import AccountFavorites from '@/pages/account/favorites';
import AccountBilling from '@/pages/account/billing';
import AccountSupport from '@/pages/account/support';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/index';
import AdminUsers from '@/pages/admin/users';
import AdminUserId from '@/pages/admin/users-id';
import AdminUsersRoles from '@/pages/admin/users-roles';
import AdminStaff from '@/pages/admin/staff';
import AdminModeration from '@/pages/admin/moderation';
import AdminContent from '@/pages/admin/content';
import AdminAdvertising from '@/pages/admin/advertising';
import AdminBilling from '@/pages/admin/billing';
import AdminSettings from '@/pages/admin/settings';
import AdminSystem from '@/pages/admin/system';

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

          <Route path="/account" element={<AccountLayout />}>
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

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserId />} />
            <Route path="users/roles" element={<AdminUsersRoles />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="moderation" element={<AdminModeration />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="advertising" element={<AdminAdvertising />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="system" element={<AdminSystem />} />
          </Route>

          <Route path="/account-old" element={<AccountPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollProgress />
      <Navbar />
      <main className="min-h-screen">
        <AnimatedRoutes />
      </main>
      <Footer />
    </BrowserRouter>
  );
}
