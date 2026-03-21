import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '@/pages/Home';
import PoolDashboard from '@/pages/PoolDashboard';
import GolferProfile from '@/pages/GolferProfile';
import PoolAdmin from '@/pages/PoolAdmin';
import AccountSettings from '@/pages/AccountSettings';
import ParticipantProfile from '@/pages/ParticipantProfile.jsx';
import PageNotFound from '@/lib/PageNotFound';

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
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/pool/:poolId" element={<PoolDashboard />} />
          <Route path="/golfer/:golferId" element={<GolferProfile />} />
          <Route path="/pool/:poolId/admin" element={<PoolAdmin />} />
          <Route path="/participant/:name" element={<ParticipantProfile />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}