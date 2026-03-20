import { AdminInbox } from '@/components/admin/AdminInbox';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminInboxPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  return <AdminInbox redirectPath={`/${locale}/admin/inbox`} />;
}
