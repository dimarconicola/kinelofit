'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  label: string;
  copiedLabel: string;
  className?: string;
}

export function ShareButton({ title, text, url, label, copiedLabel, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const sharePayload = useMemo(() => [text, url].filter(Boolean).join('\n').trim(), [text, url]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      await navigator.clipboard.writeText(sharePayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore aborted shares: this control is additive.
    }
  };

  return (
    <button type="button" className={clsx('inline-link-button', className)} onClick={handleShare} data-share-url={url}>
      {copied ? copiedLabel : label}
    </button>
  );
}
