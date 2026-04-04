export interface CalendarExportEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  description?: string;
  url?: string;
}

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

const toIcsDate = (value: string) => {
  const iso = new Date(value).toISOString();
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};

export const buildIcsCalendar = (calendarName: string, events: CalendarExportEvent[]) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//kinelo.fit//Saved schedule//EN',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${escapeIcsText(`${event.id}@kinelo.fit`)}`);
    lines.push(`DTSTAMP:${toIcsDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${toIcsDate(event.startAt)}`);
    lines.push(`DTEND:${toIcsDate(event.endAt)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    if (event.url) lines.push(`URL:${escapeIcsText(event.url)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
};

export const buildGoogleCalendarHref = (event: CalendarExportEvent) => {
  const start = toIcsDate(event.startAt);
  const end = toIcsDate(event.endAt);
  const details = [event.description, event.url].filter(Boolean).join('\n\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`
  });

  if (event.location) params.set('location', event.location);
  if (details) params.set('details', details);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
