import type {
  AdminCmsEntry,
  CmsDraftFormState,
  InstagramItemDraft,
} from '@/types/admin-cms';
import type { PublicCmsKey } from '@/types/content';

export const CMS_KEY_LABELS: Record<PublicCmsKey, string> = {
  'business.contacts': 'Kontak Resmi (Email & Instagram)',
  'home.hero': 'Hero Beranda',
  'home.story': 'Cerita Dapur di Beranda',
  'home.class_promo': 'Blok Promo Kelas Baking (Beranda)',
  'home.custom_business': 'Blok B2B / Custom Business',
  'about.story': 'Kisah & Dapur (Tentang Oma)',
  'about.values': 'Nilai Brand (About Values)',
  'footer.note': 'Catatan Footer Situs',
  'legal.privacy': 'Kebijakan Privasi',
  'legal.ordering_policy': 'Kebijakan Pemesanan',
  'community.instagram': 'Komunitas Instagram Terkurasi',
  'promo.shipping_banner': 'Banner Informasi Pengiriman',
};

export function supportsCmsSingleMedia(key: PublicCmsKey | undefined): boolean {
  return (
    key === 'home.hero' ||
    key === 'home.story' ||
    key === 'home.class_promo' ||
    key === 'home.custom_business' ||
    key === 'about.story'
  );
}

export function supportsCmsTitleBody(key: PublicCmsKey | undefined): boolean {
  return (
    key === 'home.story' ||
    key === 'home.class_promo' ||
    key === 'home.custom_business' ||
    key === 'about.story' ||
    key === 'legal.privacy' ||
    key === 'legal.ordering_policy' ||
    key === 'promo.shipping_banner'
  );
}

export function entryToFormState(entry: AdminCmsEntry): CmsDraftFormState {
  const c = entry.content as Record<string, unknown>;
  const imagePath = typeof c.image_path === 'string' ? c.image_path : '';
  const rawInstagramItems = Array.isArray(c.items) ? c.items : [];
  const instagramItems: InstagramItemDraft[] =
    entry.key === 'community.instagram'
      ? rawInstagramItems.map((item) => {
          const obj = item as Record<string, unknown>;
          const path = typeof obj.image_path === 'string' ? obj.image_path : '';
          return {
            image_path: path,
            alt: typeof obj.alt === 'string' ? obj.alt : '',
            href: typeof obj.href === 'string' ? obj.href : '',
            media_approved: Boolean(obj.media_approved),
            previewUrl: path ? (entry.previewImageUrls[path] ?? null) : null,
          };
        })
      : [];

  return {
    key: entry.key,
    expectedUpdatedAt: entry.updatedAt,
    email: typeof c.email === 'string' ? c.email : '',
    instagramUrl: typeof c.instagram_url === 'string' ? c.instagram_url : '',
    headline: typeof c.headline === 'string' ? c.headline : '',
    subcopy: typeof c.subcopy === 'string' ? c.subcopy : '',
    title: typeof c.title === 'string' ? c.title : '',
    body: typeof c.body === 'string' ? c.body : '',
    text: typeof c.text === 'string' ? c.text : '',
    valuesItems:
      entry.key === 'about.values' && Array.isArray(c.items)
        ? (c.items as unknown[]).map((v) => String(v ?? ''))
        : [],
    imagePath,
    imageAlt: typeof c.image_alt === 'string' ? c.image_alt : '',
    mediaApproved: Boolean(c.media_approved),
    previewUrl: imagePath ? (entry.previewImageUrls[imagePath] ?? null) : null,
    instagramFeedUrl: typeof c.url === 'string' ? c.url : '',
    instagramItems,
  };
}

export function buildContentPayloadFromForm(
  form: CmsDraftFormState,
): Record<string, unknown> {
  switch (form.key) {
    case 'business.contacts':
      return {
        email: form.email.trim(),
        instagram_url: form.instagramUrl.trim(),
      };
    case 'home.hero': {
      const payload: Record<string, unknown> = {
        headline: form.headline.trim(),
        subcopy: form.subcopy.trim(),
      };
      if (form.imagePath.trim().length > 0) {
        payload.image_path = form.imagePath.trim();
        payload.image_alt = form.imageAlt.trim();
        payload.media_approved = form.mediaApproved;
      } else if (form.imageAlt.trim().length > 0) {
        payload.image_alt = form.imageAlt.trim();
      }
      return payload;
    }
    case 'home.story':
    case 'home.class_promo':
    case 'home.custom_business':
    case 'about.story': {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body.trim(),
      };
      if (form.imagePath.trim().length > 0) {
        payload.image_path = form.imagePath.trim();
        payload.image_alt = form.imageAlt.trim();
        payload.media_approved = form.mediaApproved;
      } else if (form.imageAlt.trim().length > 0) {
        payload.image_alt = form.imageAlt.trim();
      }
      return payload;
    }
    case 'about.values':
      return {
        items: form.valuesItems
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      };
    case 'footer.note':
      return {
        text: form.text.trim(),
      };
    case 'legal.privacy':
    case 'legal.ordering_policy':
    case 'promo.shipping_banner':
      return {
        title: form.title.trim(),
        body: form.body.trim(),
      };
    case 'community.instagram':
      return {
        url: form.instagramFeedUrl.trim(),
        items: form.instagramItems.map((item) => ({
          image_path: item.image_path.trim(),
          alt: item.alt.trim(),
          href: item.href.trim(),
          media_approved: true as const,
        })),
      };
  }
}
