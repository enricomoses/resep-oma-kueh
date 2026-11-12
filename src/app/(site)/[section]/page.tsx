import { notFound } from 'next/navigation';
import { SITE_HELP, SITE_NAV } from '@/constants/site.constant';
import { PreparingView } from '@/components/site/preparing-view';

export default async function PreparingPage({
  params,
}: PageProps<'/[section]'>) {
  const { section } = await params;
  const item = [...SITE_NAV, ...SITE_HELP].find(
    (item) => item.href === `/${section}`,
  );
  if (!item) notFound();
  return <PreparingView title={item.label} />;
}
