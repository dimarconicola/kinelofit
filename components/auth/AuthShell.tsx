import type { ReactNode } from 'react';

import { ServerChip } from '@/components/ui/server';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  sideEyebrow: string;
  sideTitle: string;
  sideLead?: string;
  sideItems: string[];
  chips?: string[];
}

export function AuthShell({
  eyebrow,
  title,
  lead,
  children,
  sideEyebrow,
  sideTitle,
  sideLead,
  sideItems,
  chips = []
}: AuthShellProps) {
  return (
    <section className="detail-hero auth-shell">
      <div className="panel auth-shell-main">
        <div className="auth-shell-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          {chips.length > 0 ? (
            <div className="auth-shell-chips">
              {chips.map((chip) => (
                <ServerChip key={chip} tone="meta">
                  {chip}
                </ServerChip>
              ))}
            </div>
          ) : null}
        </div>
        <div className="auth-shell-body">{children}</div>
      </div>

      <aside className="panel auth-shell-side">
        <p className="eyebrow">{sideEyebrow}</p>
        <h2>{sideTitle}</h2>
        {sideLead ? <p className="lead">{sideLead}</p> : null}
        <ul className="auth-shell-list">
          {sideItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
