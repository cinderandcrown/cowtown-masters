import React from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '@/pages/Home';
import PoolDashboard from '@/pages/PoolDashboard';
import GolferProfile from '@/pages/GolferProfile';
import PoolAdmin from '@/pages/PoolAdmin';
import AccountSettings from '@/pages/AccountSettings';
import ParticipantProfile from '@/pages/ParticipantProfile';
import ParticipantLogin from '@/pages/ParticipantLogin';
import PageNotFound from '@/lib/PageNotFound';
import { ParticipantProvider } from '@/lib/ParticipantContext';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = { duration: 0.25, ease: 'easeInOut' };

// Wrapper that provides ParticipantContext for pool-scoped routes
function PoolWrapper({ children }) {
  const { poolId } = useParams();
  return <ParticipantProvider poolId={poolId}>{children}</ParticipantProvider>;
}

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
          <Route path="/pool/:poolId" element={<PoolWrapper><PoolDashboard /></PoolWrapper>} />
          <Route path="/pool/:poolId/login" element={<PoolWrapper><ParticipantLogin /></PoolWrapper>} />
          <Route path="/pool/:poolId/admin" element={<PoolWrapper><PoolAdmin /></PoolWrapper>} />
          <Route path="/golfer/:golferId" element={<GolferProfile />} />
          <Route path="/participant/:name" element={<ParticipantProfile />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}