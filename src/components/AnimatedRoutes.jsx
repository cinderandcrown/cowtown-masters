import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from '@/lib/PageNotFound';

const Home = lazy(() => import('@/pages/Home'));
const PoolDashboard = lazy(() => import('@/pages/PoolDashboard'));
const GolferProfile = lazy(() => import('@/pages/GolferProfile'));
const PoolAdmin = lazy(() => import('@/pages/PoolAdmin'));
const AccountSettings = lazy(() => import('@/pages/AccountSettings'));
const ParticipantProfile = lazy(() => import('@/pages/ParticipantProfile'));

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = { duration: 0.2, ease: 'easeInOut' };

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="min-h-screen"
      >
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        }>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/pool/:poolId" element={<PoolDashboard />} />
            <Route path="/golfer/:golferId" element={<GolferProfile />} />
            <Route path="/pool/:poolId/admin" element={<PoolAdmin />} />
            <Route path="/participant/:name" element={<ParticipantProfile />} />
            <Route path="/account" element={<AccountSettings />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}