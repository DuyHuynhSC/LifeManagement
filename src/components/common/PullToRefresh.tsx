import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ArrowDown, CheckCircle2 } from 'lucide-react';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  pullDownText?: string;
  releaseText?: string;
  refreshingText?: string;
  successText?: string;
  threshold?: number;
  maxPull?: number;
  refreshHeight?: number;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isRefreshing = false,
  pullDownText = 'Kéo xuống để cập nhật giá',
  releaseText = 'Thả ra để cập nhật giá',
  refreshingText = 'Đang tải lại giá cổ phiếu...',
  successText = 'Đã cập nhật giá mới nhất',
  threshold = 65,
  maxPull = 110,
  refreshHeight = 52,
  disabled = false,
  className = '',
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'success'>('idle');

  // Tracking refs for gestures
  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const canPullRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  isRefreshingRef.current = isRefreshing;

  const pullDistanceRef = useRef<number>(0);
  pullDistanceRef.current = pullDistance;

  // Timeout ref to safely manage cleanup without re-render loop
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  // Handle refresh execution strictly on user pull gesture
  const executeRefresh = useCallback(async () => {
    clearTimer();
    setStatus('refreshing');
    setPullDistance(refreshHeight);

    try {
      await onRefresh();
      setStatus('success');
      // Show success feedback briefly before smooth collapse
      timerRef.current = setTimeout(() => {
        setPullDistance(0);
        timerRef.current = setTimeout(() => {
          setStatus('idle');
          timerRef.current = null;
        }, 300);
      }, 700);
    } catch {
      setPullDistance(0);
      setStatus('idle');
    }
  }, [onRefresh, refreshHeight]);

  // Non-passive Touch listener setup for reliable pull-to-refresh on mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || isRefreshingRef.current) return;
      if (container.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        canPullRef.current = true;
      } else {
        canPullRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPullRef.current || disabled || isRefreshingRef.current) return;
      
      // If user has scrolled down, cannot pull
      if (container.scrollTop > 0) {
        canPullRef.current = false;
        if (pullDistanceRef.current > 0) {
          setPullDistance(0);
          setIsPulling(false);
          setStatus('idle');
        }
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = currentX - startXRef.current;

      // Only activate when dragging downward more vertically than horizontally
      if (diffY > 0 && diffY > Math.abs(diffX) * 1.1) {
        // Prevent default browser rubber-banding/overscroll
        if (e.cancelable) {
          e.preventDefault();
        }

        setIsPulling(true);
        // Logarithmic damping curve
        const distance = Math.min(maxPull, Math.pow(diffY, 0.88) * 1.5);
        setPullDistance(distance);

        if (distance >= threshold) {
          setStatus('ready');
        } else {
          setStatus('pulling');
        }
      }
    };

    const handleTouchEnd = () => {
      if (!canPullRef.current) return;
      canPullRef.current = false;
      setIsPulling(false);

      if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
        executeRefresh();
      } else if (!isRefreshingRef.current) {
        setPullDistance(0);
        setStatus('idle');
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled, executeRefresh, maxPull, threshold]);

  // Desktop Mouse Grab & Drag support
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || disabled || isRefreshingRef.current) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const startY = e.clientY;
    const startX = e.clientX;
    let dragging = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (container.scrollTop > 0) {
        dragging = false;
        setPullDistance(0);
        setIsPulling(false);
        setStatus('idle');
        return;
      }

      const diffY = moveEvent.clientY - startY;
      const diffX = moveEvent.clientX - startX;

      if (diffY > 6 && diffY > Math.abs(diffX)) {
        dragging = true;
        setIsPulling(true);
        const distance = Math.min(maxPull, Math.pow(diffY, 0.88) * 1.5);
        setPullDistance(distance);

        if (distance >= threshold) {
          setStatus('ready');
        } else {
          setStatus('pulling');
        }
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragging) {
        setIsPulling(false);
        if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
          executeRefresh();
        } else if (!isRefreshingRef.current) {
          setPullDistance(0);
          setStatus('idle');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const pullPercentage = Math.min(100, Math.round((pullDistance / threshold) * 100));

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`relative overscroll-y-contain ${isPulling ? 'cursor-grabbing select-none' : ''} ${className}`}
    >
      {/* Animated Pull-to-Refresh Indicator Banner */}
      <div
        className="overflow-hidden flex items-center justify-center transition-[height,opacity] ease-out pointer-events-none"
        style={{
          height: `${pullDistance}px`,
          transitionDuration: isPulling ? '0ms' : '260ms',
          opacity: pullDistance > 6 || status === 'refreshing' || status === 'success' ? 1 : 0
        }}
      >
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md border backdrop-blur-md transition-all duration-200 ${
            status === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 scale-100 shadow-emerald-500/10'
              : status === 'refreshing'
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 scale-100 shadow-indigo-500/10'
                : status === 'ready'
                  ? 'bg-indigo-600 text-white border-indigo-500 scale-105 shadow-indigo-500/25 ring-2 ring-indigo-400/30'
                  : 'bg-white/95 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 scale-95'
          }`}
        >
          {status === 'success' && (
            <>
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successText}</span>
            </>
          )}

          {status === 'refreshing' && (
            <>
              <RefreshCw size={15} className="text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
              <span>{refreshingText}</span>
            </>
          )}

          {status === 'ready' && (
            <>
              <ArrowDown size={15} className="text-white animate-bounce shrink-0" />
              <span>{releaseText}</span>
            </>
          )}

          {(status === 'pulling' || status === 'idle') && (
            <>
              <RefreshCw
                size={14}
                style={{ transform: `rotate(${(pullDistance / threshold) * 200}deg)` }}
                className="text-slate-500 dark:text-slate-300 transition-transform duration-75 shrink-0"
              />
              <span>{pullDownText} ({pullPercentage}%)</span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};
