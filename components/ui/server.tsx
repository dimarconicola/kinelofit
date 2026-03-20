import NextLink from 'next/link';
import clsx from 'clsx';
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

const isExternalHref = (href: string) => href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');

interface ServerLinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'children'> {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function ServerLink({ href, children, className, target, rel, ...props }: ServerLinkProps) {
  if (isExternalHref(href) || target) {
    return (
      <a href={href} className={className} target={target} rel={rel} {...props}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} className={className} {...props}>
      {children}
    </NextLink>
  );
}

interface ServerButtonLinkProps extends Omit<ServerLinkProps, 'className'> {
  className?: string;
}

export function ServerButtonLink({ href, children, className, target, rel, ...props }: ServerButtonLinkProps) {
  return (
    <ServerLink href={href} className={clsx('button', className)} target={target} rel={rel} {...props}>
      {children}
    </ServerLink>
  );
}

interface ServerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: ReactNode;
}

export function ServerButton({ className, children, type = 'button', ...props }: ServerButtonProps) {
  return (
    <button type={type} className={clsx('button', className)} {...props}>
      {children}
    </button>
  );
}

interface ServerChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: 'default' | 'meta';
}

export function ServerChip({ className, children, tone = 'default', ...props }: ServerChipProps) {
  return (
    <span className={clsx(tone === 'meta' && 'meta-pill', className)} {...props}>
      {children}
    </span>
  );
}

interface ServerCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ServerCard({ className, children, ...props }: ServerCardProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface ServerCardLinkProps extends Omit<ServerLinkProps, 'className'> {
  className?: string;
}

export function ServerCardLink({ href, className, children, target, rel, ...props }: ServerCardLinkProps) {
  return (
    <ServerLink href={href} className={className} target={target} rel={rel} {...props}>
      {children}
    </ServerLink>
  );
}

interface ServerInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function ServerInput({ label, className, ...props }: ServerInputProps) {
  return (
    <label>
      <span>{label}</span>
      <input className={className} {...props} />
    </label>
  );
}
