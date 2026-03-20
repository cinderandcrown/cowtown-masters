import { useState, useRef, useCallback } from 'react';

export default function usePullToRefresh(onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const THRESHOLD = 80;

  const onTouchStart = useCallback((e) => {
    const scrollTop = e.currentTarget.scrollTop || 0;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 120));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  const pullProps = { onTouchStart, onTouchMove, onTouchEnd };

  const PullIndicator = () => {
    if (pullDistance <= 0 && !isRefreshing) return null;
    return (
      <div
        className="flex items-center justify-center transition-all overflow-hidden"
        style={{ height: isRefreshing ? 48 : pullDistance }}
      >
        <div className={`w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ opacity: Math.min(pullDistance / THRESHOLD, 1), transform: `rotate(${pullDistance * 3}deg)` }}
        />
      </div>
    );
  };

  return { pullProps, PullIndicator, isRefreshing };
}