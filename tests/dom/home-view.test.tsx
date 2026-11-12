import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeView } from '@/components/home/home-view';
import {
  HOME_CMS_DEFAULTS,
  HOME_COPY,
  HOME_SECTION_IDS,
} from '@/constants/home.constant';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import type { PublicBranch } from '@/types/branch';
import type { HomePageData } from '@/types/home';

const navigation = vi.hoisted(() => ({
  search: '',
  replace: vi.fn((url: string) => {
    const [, query = ''] = url.split('?');
    navigation.search = query;
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(navigation.search),
  useRouter: () => navigation,
}));

const SURABAYA: PublicBranch = {
  id: 'f0400000-0000-4000-8000-000000000001',
  code: 'surabaya',
  name: 'Surabaya',
  city: 'Surabaya',
  whatsappNumber: '6281703384308',
  address: 'Rungkut Asri Tengah V No. 22, Surabaya',
  mapsUrl: null,
};

const BINTARO: PublicBranch = {
  id: 'f0400000-0000-4000-8000-000000000002',
  code: 'bintaro',
  name: 'Bintaro',
  city: 'Bintaro',
  whatsappNumber: '6285119785194',
  address: null,
  mapsUrl: null,
};

const CONTACTS = {
  email: 'resepoma.kueh2@gmail.com',
  instagramUrl: 'https://www.instagram.com/resepoma.kueh/',
  branches: [
    {
      code: 'surabaya',
      name: 'Surabaya',
      whatsappNumber: '6281703384308',
      address: 'Rungkut Asri Tengah V No. 22, Surabaya',
    },
    {
      code: 'bintaro',
      name: 'Bintaro',
      whatsappNumber: '6285119785194',
      address: null,
    },
  ],
} as const;

const LOADED_DATA: HomePageData = {
  content: {
    status: 'success',
    data: {
      hero: HOME_CMS_DEFAULTS.HERO,
      story: HOME_CMS_DEFAULTS.STORY,
      customBusiness: HOME_CMS_DEFAULTS.CUSTOM_BUSINESS,
      classPromo: HOME_CMS_DEFAULTS.CLASS_PROMO,
      instagram: { url: CONTACTS.instagramUrl },
    },
  },
  categories: {
    status: 'success',
    data: [
      {
        id: 'f0400000-0000-4000-8000-000000000200',
        name: 'DEMO — Chiffon Series',
        slug: 'demo-chiffon-series',
        description: 'Data sintetis lokal.',
        sortOrder: 0,
      },
    ],
  },
  featuredProducts: {
    status: 'success',
    data: [
      {
        id: 'f0400000-0000-4000-8000-000000000400',
        name: 'DEMO — Coffee Chiffon',
        slug: 'demo-coffee',
        shortDescription: null,
        description: 'SYNTHETIC DEMO lokal.',
        productType: 'variants',
        isBestSeller: true,
        isNew: false,
        primaryCategory: {
          name: 'DEMO — Chiffon Series',
          slug: 'demo-chiffon-series',
        },
        imageAlt: 'DEMO — ilustrasi placeholder',
      },
    ],
  },
  promotions: {
    status: 'success',
    data: [
      {
        id: 'f0400000-0000-4000-8000-000000000931',
        title: 'DEMO — current at reference clock',
        slug: 'demo-current',
        description: 'Promo khusus cabang Bintaro.',
        discountType: 'fixed',
        discountValue: 2000,
        minSpendIdr: 0,
        maxDiscountIdr: 5000,
        scope: 'product',
        startsAt: '2026-11-10T00:00:00+07:00',
        endsAt: '2026-11-18T00:00:00+07:00',
        branchIds: [BINTARO.id],
      },
    ],
  },
  upcomingClasses: {
    status: 'success',
    data: [
      {
        id: 'f0400000-0000-4000-8000-000000000951',
        startsAt: '2026-12-11T10:00:00+07:00',
        endsAt: '2026-12-11T12:00:00+07:00',
        registrationDeadlineAt: '2026-12-10T10:00:00+07:00',
        capacity: 12,
        seatsLeft: 8,
        branch: {
          id: SURABAYA.id,
          code: 'surabaya',
          name: 'Surabaya',
          city: 'Surabaya',
        },
        program: {
          id: 'f0400000-0000-4000-8000-000000000940',
          title: 'DEMO — Fruit Tartlet',
          slug: 'demo-class-0',
          shortDescription: null,
          description: 'SYNTHETIC DEMO class.',
          ageMin: null,
          ageMax: null,
          durationMinutes: null,
          coverAlt: 'DEMO — ilustrasi placeholder',
        },
      },
    ],
  },
  testimonials: {
    status: 'success',
    data: [],
  },
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  navigation.search = '';
  navigation.replace.mockClear();
});

function renderHome(data: HomePageData = LOADED_DATA) {
  return render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: null },
        }}
      >
        <HomeView data={data} contacts={CONTACTS} />
      </BranchProvider>
    </ReactQueryProvider>,
  );
}

it('renders all 9 main Home sections in the exact PRD §6.2 order', () => {
  const { container } = renderHome();
  const sectionIds = Array.from(
    container.querySelectorAll('main > section'),
  ).map((section) => section.id);
  expect(sectionIds).toEqual([
    HOME_SECTION_IDS.HERO,
    HOME_SECTION_IDS.SERIES,
    HOME_SECTION_IDS.FEATURED,
    HOME_SECTION_IDS.STORY,
    HOME_SECTION_IDS.TREATS,
    HOME_SECTION_IDS.CLASSES,
    HOME_SECTION_IDS.TESTIMONIALS,
    HOME_SECTION_IDS.FIND_US,
    HOME_SECTION_IDS.COMMUNITY,
  ]);
  expect(screen.getByText(HOME_COPY.FEATURED_PRICE_NOTE)).toBeInTheDocument();
  expect(screen.getByText(HOME_COPY.TESTIMONIALS_EMPTY)).toBeInTheDocument();
});

it('updates branch-scoped promotions, classes, and links when a branch is selected in Find Us', async () => {
  const view = renderHome();
  await waitFor(() =>
    expect(
      screen.getByRole('button', {
        name: `${HOME_COPY.FIND_US_SELECT_CTA} Surabaya`,
      }),
    ).toBeEnabled(),
  );

  expect(
    screen.getByText('DEMO — current at reference clock'),
  ).toBeInTheDocument();
  expect(screen.getByText('DEMO — Fruit Tartlet')).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole('button', {
      name: `${HOME_COPY.FIND_US_SELECT_CTA} Surabaya`,
    }),
  );
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith('/?branch=surabaya', {
      scroll: false,
    }),
  );
  navigation.search = '';

  view.rerender(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: null },
        }}
      >
        <HomeView data={LOADED_DATA} contacts={CONTACTS} />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  await waitFor(() =>
    expect(screen.getByText(HOME_COPY.TREATS_EMPTY)).toBeInTheDocument(),
  );
  expect(screen.getByText('DEMO — Fruit Tartlet')).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: HOME_COPY.HERO_EXPLORE_CTA }),
  ).toHaveAttribute('href', '/menu?branch=surabaya');
});

it('renders distinct empty and error states per section without crashing the page', () => {
  renderHome({
    content: { status: 'error' },
    categories: { status: 'error' },
    featuredProducts: { status: 'error' },
    promotions: { status: 'error' },
    upcomingClasses: { status: 'error' },
    testimonials: { status: 'error' },
  });

  expect(screen.getByText(HOME_COPY.SERIES_ERROR)).toBeInTheDocument();
  expect(screen.getByText(HOME_COPY.FEATURED_ERROR)).toBeInTheDocument();
  expect(screen.getByText(HOME_COPY.TREATS_ERROR)).toBeInTheDocument();
  expect(screen.getByText(HOME_COPY.CLASSES_ERROR)).toBeInTheDocument();
  expect(screen.getByText(HOME_COPY.TESTIMONIALS_ERROR)).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: HOME_CMS_DEFAULTS.HERO.headline,
    }),
  ).toBeInTheDocument();
});
