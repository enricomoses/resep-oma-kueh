import { notFound } from 'next/navigation';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_NAV } from '@/constants/site.constant';
import { PreparingView } from '@/components/site/preparing-view';

const PENDING_SECTIONS = new Set<string>([ROUTES.MENU, ROUTES.CLASSES]);

export default async function PreparingPage({
  params,
}: PageProps<'/[section]'>) {
  const { section } = await params;
  const href = `/${section}`;
  if (!PENDING_SECTIONS.has(href)) notFound();
  const item = SITE_NAV.find((navItem) => navItem.href === href);
  if (!item) notFound();
  return <PreparingView title={item.label} />;
}
