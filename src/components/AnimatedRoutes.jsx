import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from '@/pages/Home';
import PoolDashboard from '@/pages/PoolDashboard';

import PoolAdmin from '@/pages/PoolAdmin';
import AccountSettings from '@/pages/AccountSettings';

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

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);
  return null;
}

export default function AnimatedRoutes() {
  const location = useLocation();

  // Use a stable key for pool tab routes to avoid re-animating on tab switch
  const poolMatch = location.pathname.match(/^\/pool\/([^/]+)/);
  const animationKey = poolMatch ? `/pool/${poolMatch[1]}` : location.pathname;

  return (
    <>
    <ScrollToTop />
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
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
          <Route path="/pool/:poolId/:activeTab" element={<PoolWrapper><PoolDashboard /></PoolWrapper>} />
          <Route path="/pool/:poolId/login" element={<PoolWrapper><ParticipantLogin /></PoolWrapper>} />
          <Route path="/pool/:poolId/admin" element={<PoolWrapper><PoolAdmin /></PoolWrapper>} />


          <Route path="/account" element={<AccountSettings />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
    </>
  );
}