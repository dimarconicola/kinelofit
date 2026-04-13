'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { Locale } from '@/lib/catalog/types';
import { useAuthStatus } from '@/components/providers/AuthStatusProvider';
import { usePwa } from '@/components/providers/PwaProvider';
import { trackProductEvent } from '@/lib/observability/sentry';

export function StandaloneHomeRedirect({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { loading, signedInEmail } = useAuthStatus();
  const { isStandalone } = usePwa();

  useEffect(() => {
    if (!isStandalone || loading || !signedInEmail) return;

    trackProductEvent('pwa_standalone_redirect_to_palermo', { locale });
    router.replace(`/${locale}/palermo`);
  }, [isStandalone, loading, locale, router, signedInEmail]);

  return null;
}
