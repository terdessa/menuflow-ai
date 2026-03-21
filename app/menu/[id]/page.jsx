import { notFound } from 'next/navigation';
import PublicMenuClient from '@/components/PublicMenuClient';
import { getPublicMenu } from '@/lib/server/menu-store';

export const dynamic = 'force-dynamic';

export default async function PublicMenuPage({ params }) {
  const { id } = await params;
  const menuRecord = await getPublicMenu(id);

  if (!menuRecord) {
    notFound();
  }

  return <PublicMenuClient menuId={id} initialMenuRecord={menuRecord} />;
}
