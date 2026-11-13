import { describe, expect, it } from 'vitest';

import { PUBLIC_CMS_KEYS } from '@/constants/content.constant';
import {
  createAdminFaqInputSchema,
  createAdminTestimonialInputSchema,
  safeHttpsSourceUrlSchema,
  saveAdminCmsInputSchema,
} from '@/validations/admin-cms.schema';
import {
  cmsPayloadSchemasByKey,
  publicCmsKeySchema,
} from '@/validations/content.schema';

describe('F20 admin CMS, FAQ, and testimonial Zod validation', () => {
  it('allows only allowlisted public CMS keys and rejects arbitrary keys', () => {
    for (const key of PUBLIC_CMS_KEYS) {
      expect(publicCmsKeySchema.safeParse(key).success).toBe(true);
    }
    expect(publicCmsKeySchema.safeParse('custom.arbitrary').success).toBe(
      false,
    );
    expect(publicCmsKeySchema.safeParse('home.html_embed').success).toBe(false);
  });

  it('rejects raw HTML tags, javascript/vbscript URIs, and unsafe external URLs across CMS and FAQ payloads', () => {
    const heroSchema = cmsPayloadSchemasByKey['home.hero'];
    expect(
      heroSchema.safeParse({
        headline: '<script>alert(1)</script>',
        subcopy: 'Normal copy',
      }).success,
    ).toBe(false);

    expect(
      cmsPayloadSchemasByKey['business.contacts'].safeParse({
        email: 'resepoma.kueh2@gmail.com',
        instagram_url: 'https://evil.example.com/phishing',
      }).success,
    ).toBe(false);

    expect(
      cmsPayloadSchemasByKey['community.instagram'].safeParse({
        url: 'https://www.instagram.com/resepoma.kueh/',
        items: [
          {
            image_path: 'approved/f0400000-0000-4000-8000-000000000990.png',
            alt: 'Kartu IG',
            href: 'javascript:alert(1)',
            media_approved: true,
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      createAdminFaqInputSchema.safeParse({
        category: 'Pemesanan',
        question: 'Apakah aman? <img onerror=alert(1)>',
        answer: 'Aman tanpa HTML.',
      }).success,
    ).toBe(false);

    expect(
      safeHttpsSourceUrlSchema.safeParse('http://insecure.test').success,
    ).toBe(false);
    expect(
      safeHttpsSourceUrlSchema.safeParse('https://example.com/ok?v=1').success,
    ).toBe(true);
  });

  it('defaults testimonials to anonymous draft with null rating and denies publish without consent evidence', () => {
    const parsedDraft = createAdminTestimonialInputSchema.parse({
      quote: 'Tekstur chiffon sangat lembut.',
    });
    expect(parsedDraft.displayName).toBe('Pelanggan Resep Oma');
    expect(parsedDraft.rating).toBeNull();
    expect(parsedDraft.status).toBe('draft');

    const deniedMissingConsent = createAdminTestimonialInputSchema.safeParse({
      quote: 'Tanpa bukti izin.',
      status: 'published',
      consentAt: null,
      consentReference: null,
    });
    expect(deniedMissingConsent.success).toBe(false);

    const deniedMissingRef = createAdminTestimonialInputSchema.safeParse({
      quote: 'Tanggal ada tapi referensi kosong.',
      status: 'published',
      consentAt: '2026-11-13T00:00:00.000Z',
      consentReference: '   ',
    });
    expect(deniedMissingRef.success).toBe(false);

    const allowedWithConsent = createAdminTestimonialInputSchema.safeParse({
      quote: 'Sangat enak.',
      status: 'published',
      consentAt: '2026-11-13T00:00:00.000Z',
      consentReference: 'Izin tertulis arsip internal #2026-11',
    });
    expect(allowedWithConsent.success).toBe(true);
  });

  it('requires strict outer structure for CMS save inputs', () => {
    expect(
      saveAdminCmsInputSchema.safeParse({
        status: 'published',
        expectedUpdatedAt: null,
        content: { text: 'Catatan footer aman' },
        extraField: 'unexpected',
      }).success,
    ).toBe(false);
  });
});
