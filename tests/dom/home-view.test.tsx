import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { HomeView } from '@/app/(site)/_components/home-view';
import { CLASSES_COPY } from '@/constants/classes.constant';
import {
  HOME_CMS_DEFAULTS,
  HOME_COPY,
  HOME_SECTION_IDS,
} from '@/constants/home.constant';
import { PROMOTION_COPY } from '@/constants/promotion.constant';
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

it('hides What They Say when no consented testimonials exist, and renders all 9 sections in exact PRD §6.2 order when present', () => {
  const hiddenRender = renderHome();
  const hiddenSectionIds = Array.from(
    hiddenRender.container.querySelectorAll('main > section'),
  ).map((section) => section.id);
  expect(hiddenSectionIds).toEqual([
    HOME_SECTION_IDS.HERO,
    HOME_SECTION_IDS.SERIES,
    HOME_SECTION_IDS.FEATURED,
    HOME_SECTION_IDS.STORY,
    HOME_SECTION_IDS.TREATS,
    HOME_SECTION_IDS.CLASSES,
    HOME_SECTION_IDS.FIND_US,
    HOME_SECTION_IDS.COMMUNITY,
  ]);
  expect(screen.queryByText(HOME_COPY.TESTIMONIALS_EMPTY)).toBeNull();
  hiddenRender.unmount();

  const { container } = renderHome({
    ...LOADED_DATA,
    testimonials: {
      status: 'success',
      data: [
        {
          id: 'f0400000-0000-4000-8000-000000000970',
          displayName: 'Pelanggan Resep Oma',
          quote: 'Empuk dan harum klasik.',
          rating: 5,
          sourceLabel: 'Izin tercatat',
        },
      ],
    },
  });
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
  expect(screen.getByText(/Empuk dan harum klasik/)).toBeInTheDocument();
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

it('renders baking class cards inside landscape baking-class-grid with uniform clamped & aligned slots across multiple cards', () => {
  const { container } = renderHome({
    ...LOADED_DATA,
    upcomingClasses: {
      status: 'success',
      data: [
        {
          ...(LOADED_DATA.upcomingClasses.status === 'success'
            ? LOADED_DATA.upcomingClasses.data[0]
            : (() => {
                throw new Error('Expected upcomingClasses success');
              })()),
          effectivePriceIdr: 185_000,
        },
        {
          id: 'f0400000-0000-4000-8000-000000000952',
          startsAt: '2026-12-18T10:00:00+07:00',
          endsAt: '2026-12-18T12:30:00+07:00',
          registrationDeadlineAt: null,
          capacity: 10,
          seatsLeft: null,
          branch: {
            id: BINTARO.id,
            code: 'bintaro',
            name: 'Bintaro',
            city: 'Bintaro',
          },
          program: {
            id: 'f0400000-0000-4000-8000-000000000941',
            title:
              'Kelas Spesial Menghias Chiffon Pandan Klasik Bersama Oma untuk Pemula',
            slug: 'demo-class-1',
            shortDescription:
              'Deskripsi panjang kelas baking untuk menguji batas tampilan kartu agar tetap rapi dan sejajar ketika dibandingkan dengan kartu lain.',
            description: 'Deskripsi lengkap.',
            ageMin: 6,
            ageMax: 14,
            durationMinutes: 150,
            coverAlt: 'DEMO — kelas chiffon',
          },
        },
      ],
    },
  });

  const classesSection = container.querySelector(
    `#${HOME_SECTION_IDS.CLASSES}`,
  );
  expect(classesSection).not.toBeNull();
  const grid = classesSection?.querySelector('.baking-class-grid');
  expect(grid).not.toBeNull();

  const cards = grid?.querySelectorAll('.baking-class-card') ?? [];
  expect(cards).toHaveLength(2);
  for (const card of cards) {
    expect(card.querySelector('.baking-class-media')).not.toBeNull();
    expect(card.querySelector('.baking-class-card-title')).not.toBeNull();
    expect(card.querySelector('.baking-class-card-description')).not.toBeNull();
    expect(
      card.querySelector('.baking-class-card-schedule-block'),
    ).not.toBeNull();
    expect(card.querySelector('.baking-class-card-footer')).not.toBeNull();
  }
  expect(screen.getByText(/Rp\s*185\.000/)).toBeInTheDocument();
  expect(screen.queryByText(/Mulai dari/)).toBeNull();
  expect(screen.getByText(CLASSES_COPY.PRICE_CONFIRM_NOTE)).toBeInTheDocument();
});

it('renders Current Treats promo cards with offer band, scope badge, terms, clamped body, and overflow-safe layout', () => {
  const { container } = renderHome({
    ...LOADED_DATA,
    promotions: {
      status: 'success',
      data: [
        {
          id: 'f0400000-0000-4000-8000-000000000931',
          title: 'Promo Akhir Pekan Spesial Chiffon Oma',
          slug: 'promo-weekend',
          description: 's'.repeat(180),
          discountType: 'percentage',
          discountValue: 50,
          minSpendIdr: 50_000,
          maxDiscountIdr: 25_000,
          scope: 'category',
          startsAt: '2026-11-16T10:00:00+07:00',
          endsAt: '2026-11-23T10:00:00+07:00',
          branchIds: [],
        },
      ],
    },
  });

  const treatsSection = container.querySelector(`#${HOME_SECTION_IDS.TREATS}`);
  expect(treatsSection).not.toBeNull();
  const cards = treatsSection?.querySelectorAll('.home-treat-card') ?? [];
  expect(cards).toHaveLength(1);
  expect(cards[0]?.querySelector('.home-treat-offer-band')).not.toBeNull();
  expect(cards[0]?.querySelector('.home-treat-title')).toHaveTextContent(
    'Promo Akhir Pekan Spesial Chiffon Oma',
  );
  expect(cards[0]?.querySelector('.home-treat-description')).not.toBeNull();
  expect(cards[0]?.querySelector('.home-treat-footer')).not.toBeNull();
  expect(screen.getByText('Diskon 50%')).toBeInTheDocument();
  expect(
    screen.getByText(PROMOTION_COPY.SCOPE_LABELS.category),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Min\. belanja Rp50\.000 · Maks\. potongan Rp25\.000/),
  ).toBeInTheDocument();
});
