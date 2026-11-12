import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AboutView } from '@/components/content/about-view';
import { ContactView } from '@/components/content/contact-view';
import { FaqView } from '@/components/content/faq-view';
import { LegalPolicyView } from '@/components/content/legal-policy-view';
import { CONTENT_COPY, CONTENT_DEFAULTS } from '@/constants/content.constant';
import { BRANCH } from '@/constants/site.constant';
import { ApiClientError } from '@/lib/errors';
import { ReactQueryProvider } from '@/providers';
import { BranchProvider } from '@/providers/branch-provider';
import * as contentService from '@/services/content.service';
import type { PublicBranch } from '@/types/branch';
import type { ContactPageData } from '@/types/content';

const navigation = vi.hoisted(() => ({
  pathname: '/about',
  search: '',
  replace: vi.fn((url: string) => {
    const [path = '/', query = ''] = url.split('?');
    navigation.pathname = path;
    navigation.search = query;
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
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

function renderWithProviders(
  ui: React.ReactNode,
  resolvedBranchId: string | null = null,
) {
  return render(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId },
        }}
      >
        {ui}
      </BranchProvider>
    </ReactQueryProvider>,
  );
}

afterEach(() => {
  cleanup();
  navigation.pathname = '/about';
  navigation.search = '';
  navigation.replace.mockClear();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

it('renders AboutView with brand values, bakers–food scientist narrative, non-certification disclaimer, and branch-preserving CTAs', async () => {
  window.localStorage.setItem(
    BRANCH.STORAGE_KEY,
    JSON.stringify({ state: { selectedBranchId: SURABAYA.id }, version: 1 }),
  );

  renderWithProviders(
    <AboutView
      initial={{
        status: 'success',
        data: {
          items: [
            {
              key: 'about.story',
              source: 'template',
              updatedAt: null,
              content: CONTENT_DEFAULTS.ABOUT_STORY,
            },
            {
              key: 'about.values',
              source: 'template',
              updatedAt: null,
              content: { items: [...CONTENT_DEFAULTS.ABOUT_VALUES] },
            },
          ],
        },
      }}
    />,
    SURABAYA.id,
  );

  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    CONTENT_DEFAULTS.ABOUT_STORY.title,
  );
  for (const value of CONTENT_DEFAULTS.ABOUT_VALUES) {
    expect(
      screen.getByRole('heading', { level: 3, name: value }),
    ).toBeInTheDocument();
  }
  expect(
    screen.getByRole('heading', {
      level: 2,
      name: CONTENT_COPY.ABOUT_TEAM_TITLE,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(CONTENT_COPY.ABOUT_TEAM_BODY)).toBeInTheDocument();
  expect(
    screen.getByText(CONTENT_COPY.ABOUT_TEAM_DISCLAIMER),
  ).toBeInTheDocument();

  await waitFor(() => {
    const menuLink = screen.getByRole('link', {
      name: CONTENT_COPY.ABOUT_EXPLORE_MENU_CTA,
    });
    expect(menuLink.getAttribute('href')).toContain('branch=surabaya');
  });
});

it('renders ContactView with Surabaya and Bintaro contacts, unconfirmed pending notices, and branch-selectable B2B WhatsApp link without MOQ/price estimates', async () => {
  navigation.pathname = '/contact';
  const contactData: ContactPageData = {
    status: 'success',
    email: 'resepoma.kueh2@gmail.com',
    instagramUrl: 'https://www.instagram.com/resepoma.kueh/',
    branches: [
      {
        id: SURABAYA.id,
        code: 'surabaya',
        name: 'Surabaya',
        city: 'Surabaya',
        whatsappNumber: '6281703384308',
        address: 'Rungkut Asri Tengah V No. 22, Surabaya',
        mapsUrl: null,
        hours: [],
      },
      {
        id: BINTARO.id,
        code: 'bintaro',
        name: 'Bintaro',
        city: 'Bintaro',
        whatsappNumber: '6285119785194',
        address: null,
        mapsUrl: null,
        hours: [],
      },
    ],
    customBusiness: {
      source: 'template',
      title: CONTENT_DEFAULTS.CUSTOM_BUSINESS.title,
      body: CONTENT_DEFAULTS.CUSTOM_BUSINESS.body,
    },
  };

  renderWithProviders(<ContactView data={contactData} />);

  expect(
    screen.getByText('Rungkut Asri Tengah V No. 22, Surabaya'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(CONTENT_COPY.CONTACT_ADDRESS_PENDING),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText(CONTENT_COPY.CONTACT_MAPS_PENDING).length,
  ).toBeGreaterThanOrEqual(2);
  expect(
    screen.getAllByText(CONTENT_COPY.CONTACT_HOURS_PENDING).length,
  ).toBeGreaterThanOrEqual(2);

  const b2bBranchSelect = screen.getByLabelText(
    CONTENT_COPY.CONTACT_B2B_BRANCH_LABEL,
  );
  const b2bTopicInput = screen.getByLabelText(
    CONTENT_COPY.CONTACT_B2B_TOPIC_LABEL,
  );

  fireEvent.change(b2bTopicInput, {
    target: { value: 'Hampers lebaran kantor' },
  });

  const surabayaCta = screen.getByRole('link', {
    name: `${CONTENT_COPY.CONTACT_B2B_CTA_PREFIX} Surabaya`,
  });
  expect(surabayaCta.getAttribute('href')).toContain(
    'https://wa.me/6281703384308?text=',
  );
  expect(decodeURIComponent(surabayaCta.getAttribute('href') ?? '')).toContain(
    'Hampers lebaran kantor',
  );

  fireEvent.change(b2bBranchSelect, { target: { value: 'bintaro' } });

  await waitFor(() => {
    const bintaroCta = screen.getByRole('link', {
      name: `${CONTENT_COPY.CONTACT_B2B_CTA_PREFIX} Bintaro`,
    });
    expect(bintaroCta.getAttribute('href')).toContain(
      'https://wa.me/6285119785194?text=',
    );
  });
});

it('renders FaqView empty and error states and supports client retry via readPublicFaqs', async () => {
  navigation.pathname = '/faq';
  const readFaqsSpy = vi
    .spyOn(contentService, 'readPublicFaqs')
    .mockRejectedValueOnce(
      new ApiClientError({ code: 'INVALID_RESPONSE', status: 503 }),
    )
    .mockResolvedValueOnce({
      ok: true,
      data: {
        items: [
          {
            id: 'f0400000-0000-4000-8000-000000000962',
            category: 'DEMO',
            question: 'DEMO — Apakah data ini dapat dipakai memesan?',
            answer:
              'Tidak. Ini data sintetis lokal, bukan katalog pemesanan aktif.',
            sortOrder: 0,
          },
        ],
      },
      requestId: 'retry-success-id',
    });

  renderWithProviders(<FaqView initial={{ status: 'error' }} />);

  await waitFor(() => {
    expect(
      screen.getByText(CONTENT_COPY.UPSTREAM_ERROR_TITLE),
    ).toBeInTheDocument();
  });

  const retryButton = screen.getByRole('button', {
    name: CONTENT_COPY.RETRY_BUTTON,
  });
  fireEvent.click(retryButton);

  await waitFor(() => {
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'DEMO — Apakah data ini dapat dipakai memesan?',
      }),
    ).toBeInTheDocument();
  });
  expect(readFaqsSpy).toHaveBeenCalledTimes(2);
});

it('distinguishes template vs owner-approved LegalPolicyView and discloses transient server processing without raw HTML execution', () => {
  navigation.pathname = '/privacy';

  const { rerender } = renderWithProviders(
    <LegalPolicyView
      policyKey="legal.privacy"
      initial={{
        status: 'success',
        data: {
          items: [
            {
              key: 'legal.privacy',
              source: 'template',
              updatedAt: null,
              content: CONTENT_DEFAULTS.LEGAL_PRIVACY,
            },
          ],
        },
      }}
    />,
  );

  expect(
    screen.getAllByText(CONTENT_COPY.SOURCE_TEMPLATE_BADGE).length,
  ).toBeGreaterThanOrEqual(1);
  expect(
    screen.getByText(
      /TIDAK mengklaim bahwa tidak ada data yang dikirim ke server/i,
    ),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/selectedBranchId/).length).toBeGreaterThanOrEqual(
    1,
  );

  rerender(
    <ReactQueryProvider>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA, BINTARO], resolvedBranchId: null },
        }}
      >
        <LegalPolicyView
          policyKey="legal.ordering_policy"
          initial={{
            status: 'success',
            data: {
              items: [
                {
                  key: 'legal.ordering_policy',
                  source: 'published',
                  updatedAt: '2026-11-12T08:00:00Z',
                  content: {
                    title: 'Kebijakan Pemesanan Resmi',
                    body: 'Seluruh pesanan dikonfirmasi manual oleh admin WhatsApp cabang.',
                  },
                },
              ],
            },
          }}
        />
      </BranchProvider>
    </ReactQueryProvider>,
  );

  expect(
    screen.getByText(CONTENT_COPY.SOURCE_PUBLISHED_BADGE),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Kebijakan Pemesanan Resmi',
    }),
  ).toBeInTheDocument();
});
