'use client';

import { HeroUIProvider } from '@heroui/react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}
