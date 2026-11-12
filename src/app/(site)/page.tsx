import { connection } from 'next/server';
import { HomeView } from '@/components/home/home-view';
import { APPROVED_CONTACTS } from '@/features/branches/contacts.server';
import { getHomeData } from '@/features/home/service.server';

export default async function Home() {
  await connection();
  const data = await getHomeData();
  return <HomeView data={data} contacts={APPROVED_CONTACTS} />;
}
