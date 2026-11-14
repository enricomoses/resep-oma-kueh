// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

import { AdminContentView } from '@/app/admin/(dashboard)/content/_components/admin-content-view';
import { AdminFaqsView } from '@/app/admin/(dashboard)/faqs/_components/admin-faqs-view';
import { AdminTestimonialsView } from '@/app/admin/(dashboard)/testimonials/_components/admin-testimonials-view';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import { ReactQueryProvider } from '@/providers/react-query-provider';
import * as adminCmsService from '@/services/admin-cms.service';
import type {
  AdminCmsListResponse,
  AdminFaqListResponse,
  AdminTestimonialListResponse,
} from '@/types/admin-cms';
import type { AdminSessionProfile } from '@/types/auth';

const OWNER_PROFILE: AdminSessionProfile = {
  userId: 'f2000000-0000-4000-8000-000000000001',
  email: 'owner@resepoma.test',
  displayName: 'Owner Resep Oma',
  role: 'owner',
  branchId: null,
  branchCode: null,
  branchName: null,
};

const INITIAL_CMS: AdminCmsListResponse = {
  items: [
    {
      key: 'business.contacts',
      status: 'published',
      content: {
        email: 'resepoma.kueh2@gmail.com',
        instagram_url: 'https://www.instagram.com/resepoma.kueh/',
      },
      previewImageUrls: {},
      updatedBy: OWNER_PROFILE.userId,
      createdAt: '2026-11-13T08:00:00.000Z',
      updatedAt: '2026-11-13T08:00:00.000Z',
      isPersisted: true,
      releaseWarnings: [ADMIN_CATALOG_COPY.CMS.CONTACTS_SOURCE_NOTE],
    },
    {
      key: 'home.hero',
      status: 'draft',
      content: {
        headline: 'A little taste of home',
        subcopy: 'Resep klasik penuh kehangatan.',
        image_alt: 'Placeholder Hero',
      },
      previewImageUrls: {},
      updatedBy: null,
      createdAt: null,
      updatedAt: null,
      isPersisted: false,
      releaseWarnings: [],
    },
    {
      key: 'legal.ordering_policy',
      status: 'draft',
      content: {
        title: 'Kebijakan Pemesanan',
        body: 'Menunggu persetujuan owner.',
      },
      previewImageUrls: {},
      updatedBy: null,
      createdAt: null,
      updatedAt: null,
      isPersisted: false,
      releaseWarnings: [ADMIN_CATALOG_COPY.CMS.OWNER_SIGNOFF_GATE],
    },
  ],
};

const INITIAL_FAQS: AdminFaqListResponse = {
  items: [
    {
      id: 'f20f0000-0000-4000-8000-000000000001',
      category: 'Pemesanan',
      question: 'Bagaimana pesan?',
      answer: 'Melalui WhatsApp cabang.',
      sortOrder: 1,
      status: 'published',
      createdAt: '2026-11-13T08:00:00.000Z',
      updatedAt: '2026-11-13T08:00:00.000Z',
    },
  ],
};

const INITIAL_TESTIMONIALS: AdminTestimonialListResponse = {
  items: [
    {
      id: 'f20e0000-0000-4000-8000-000000000001',
      displayName: 'Pelanggan Resep Oma',
      quote: 'Hands down the best chiffon cake ever.',
      rating: null,
      sourceLabel: 'Referensi historis — menunggu izin',
      sourceUrl: null,
      consentReference: null,
      consentAt: null,
      status: 'draft',
      sortOrder: 0,
      createdAt: '2026-11-13T08:00:00.000Z',
      updatedAt: '2026-11-13T08:00:00.000Z',
    },
  ],
};

describe('F20 admin CMS, FAQ, and testimonial views', () => {
  it('renders CMS key switcher, shows release warnings for contacts and legal keys, and submits draft save', async () => {
    const saveSpy = vi
      .spyOn(adminCmsService, 'saveAdminCmsEntryRequest')
      .mockResolvedValue({
        ok: true,
        requestId: 'req-1',
        data: { item: INITIAL_CMS.items[2]! },
      });

    render(
      <ReactQueryProvider>
        <AdminContentView profile={OWNER_PROFILE} initialData={INITIAL_CMS} />
      </ReactQueryProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /legal\.ordering_policy/i }),
    );
    expect(
      screen.getByText(ADMIN_CATALOG_COPY.CMS.OWNER_SIGNOFF_GATE),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: ADMIN_CATALOG_COPY.CMS.SAVE_DRAFT }),
    );
    await waitFor(() => expect(saveSpy).toHaveBeenCalled());
  });

  it('renders FAQ list and opens soft archive confirmation dialog', async () => {
    const archiveSpy = vi
      .spyOn(adminCmsService, 'archiveAdminFaqRequest')
      .mockResolvedValue({
        ok: true,
        requestId: 'req-2',
        data: {
          faq: { ...INITIAL_FAQS.items[0]!, status: 'archived' },
        },
      });

    render(
      <ReactQueryProvider>
        <AdminFaqsView profile={OWNER_PROFILE} initialData={INITIAL_FAQS} />
      </ReactQueryProvider>,
    );

    expect(screen.getByText('Bagaimana pesan?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Arsipkan' }));
    expect(
      screen.getByText(ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_TITLE),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: ADMIN_CATALOG_COPY.FAQS.ARCHIVE_CONFIRM_SUBMIT,
      }),
    );
    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
  });

  it('shows empty What They Say preview in owner admin while keeping unconsented drafts unpublished', () => {
    render(
      <ReactQueryProvider>
        <AdminTestimonialsView
          profile={OWNER_PROFILE}
          initialData={INITIAL_TESTIMONIALS}
        />
      </ReactQueryProvider>,
    );

    expect(
      screen.getByText(
        ADMIN_CATALOG_COPY.TESTIMONIALS.PREVIEW_PUBLIC_HIDDEN_NOTE,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Pelanggan Resep Oma')).toBeInTheDocument();
    expect(
      screen.getByText('Tanpa Rating', { selector: '.ui-badge' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Izin')).toBeInTheDocument();
  });
});
