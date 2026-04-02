'use client';

import { useMemo, useState } from 'react';

import { buildIcsCalendar, type CalendarExportEvent } from '@/lib/ui/calendar';

interface PersonalCollectionActionsProps {
  shareTitle: string;
  shareText: string;
  shareLabel: string;
  copiedLabel: string;
  calendarLabel?: string;
  calendarFileName?: string;
  calendarName?: string;
  calendarEvents?: CalendarExportEvent[];
}

export function PersonalCollectionActions({
  shareTitle,
  shareText,
  shareLabel,
  copiedLabel,
  calendarLabel,
  calendarFileName,
  calendarName,
  calendarEvents
}: PersonalCollectionActionsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

  const sharePayload = useMemo(() => {
    const suffix = shareUrl ? `\n${shareUrl}` : '';
    return `${shareText}${suffix}`.trim();
  }, [shareText, shareUrl]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl || undefined
        });
        return;
      }

      await navigator.clipboard.writeText(sharePayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore aborted or denied shares: this control is additive, not critical.
    }
  };

  const handleCalendarExport = () => {
    if (!calendarEvents?.length || !calendarFileName || !calendarName) return;
    const ics = buildIcsCalendar(calendarName, calendarEvents);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = calendarFileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="saved-actions-row">
      {calendarLabel && calendarEvents?.length ? (
        <button type="button" className="button button-secondary" onClick={handleCalendarExport}>
          {calendarLabel}
        </button>
      ) : null}
      <button type="button" className="button button-ghost" onClick={handleShare}>
        {copied ? copiedLabel : shareLabel}
      </button>
    </div>
  );
}
