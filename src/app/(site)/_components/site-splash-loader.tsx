'use client';

import { useEffect, useState } from 'react';
import { SiteLoader } from '@/app/(site)/_components/site-loader';

const SPLASH_HOLD_MS = 2200;
const SPLASH_FADE_MS = 420;

interface SiteSplashLoaderProps {
  label: string;
}

/**
 * Shows the Oma silhouette loader on every full page load / refresh
 * for long enough to complete one full draw cycle, then fades out.
 */
export function SiteSplashLoader({ label }: SiteSplashLoaderProps) {
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'done'>('visible');

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => {
      setPhase('leaving');
    }, SPLASH_HOLD_MS);

    const doneTimer = window.setTimeout(() => {
      setPhase('done');
    }, SPLASH_HOLD_MS + SPLASH_FADE_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') {
    return null;
  }

  return <SiteLoader label={label} leaving={phase === 'leaving'} />;
}
