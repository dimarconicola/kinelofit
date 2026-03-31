'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { PublicVideoAsset } from '@/lib/media/public-videos';

type LoopVideoProps = {
  asset: PublicVideoAsset;
  label: string;
  className?: string;
  priority?: boolean;
};

const canUseControlledSourceInProduction = (asset: PublicVideoAsset) => Boolean(asset.muxPlaybackId);

export function LoopVideo({ asset, label, className, priority = false }: LoopVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(priority);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [saveDataEnabled, setSaveDataEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setPrefersReducedMotion(mediaQuery.matches);
    syncMotion();
    mediaQuery.addEventListener('change', syncMotion);

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setSaveDataEnabled(Boolean(connection?.saveData));

    return () => {
      mediaQuery.removeEventListener('change', syncMotion);
    };
  }, []);

  useEffect(() => {
    if (priority || typeof IntersectionObserver === 'undefined' || !containerRef.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const source = useMemo(() => {
    if (asset.muxPlaybackId) {
      return {
        src: `https://stream.mux.com/${asset.muxPlaybackId}.m3u8`,
        type: 'application/x-mpegURL',
        controlled: true
      };
    }

    if (asset.fallbackMp4) {
      return {
        src: asset.fallbackMp4,
        type: 'video/mp4',
        controlled: false
      };
    }

    return null;
  }, [asset.fallbackMp4, asset.muxPlaybackId]);

  const isProduction = process.env.NODE_ENV === 'production';
  const shouldAutoplay = Boolean(source) && isVisible && !prefersReducedMotion && !saveDataEnabled;
  const canRenderVideo = Boolean(source) && (!isProduction || canUseControlledSourceInProduction(asset));

  return (
    <div ref={containerRef} className="loop-video-shell" aria-label={label}>
      {canRenderVideo ? (
        <video
          className={`${className ?? ''} loop-video-element`.trim()}
          autoPlay={shouldAutoplay}
          muted
          loop
          playsInline
          preload={priority && shouldAutoplay ? 'auto' : 'metadata'}
          poster={asset.poster}
          aria-label={label}
          disablePictureInPicture
        >
          <source src={source!.src} type={source!.type} />
        </video>
      ) : (
        <Image
          src={asset.poster}
          alt={label}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`${className ?? ''} loop-video-poster`.trim()}
        />
      )}
    </div>
  );
}
