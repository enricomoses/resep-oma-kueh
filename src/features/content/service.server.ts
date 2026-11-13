import 'server-only';
import {
  CONTENT_DEFAULTS,
  PUBLIC_CMS_KEYS,
} from '@/constants/content.constant';
import { HOME_CMS_DEFAULTS } from '@/constants/home.constant';
import { APPROVED_CONTACTS } from '@/features/branches/contacts.server';
import { readActiveBranches } from '@/features/branches/repository.server';
import {
  cmsPayloadSchemasByKey,
  contactPageDataSchema,
  contentQuerySchema,
  publicBranchHourSchema,
  publicCmsEntrySchema,
  publicContentDirectorySchema,
  publicFaqDirectorySchema,
  publicFaqItemSchema,
} from '@/validations/content.schema';
import type {
  ContactPageData,
  ContentInitial,
  PublicCmsEntry,
  PublicCmsKey,
  PublicContentDirectory,
  PublicFaqDirectory,
} from '@/types/content';
import {
  readActiveBranchHours,
  readPublishedFaqs,
  readPublishedSiteContentByKeys,
} from './repository.server';

function getTemplateEntryForKey(key: PublicCmsKey): PublicCmsEntry {
  switch (key) {
    case 'business.contacts':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          email: APPROVED_CONTACTS.email,
          instagram_url: APPROVED_CONTACTS.instagramUrl,
        },
      };
    case 'home.hero':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          headline: HOME_CMS_DEFAULTS.HERO.headline,
          subcopy: HOME_CMS_DEFAULTS.HERO.subcopy,
          image_alt: HOME_CMS_DEFAULTS.HERO.imageAlt,
        },
      };
    case 'home.story':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          title: HOME_CMS_DEFAULTS.STORY.title,
          body: HOME_CMS_DEFAULTS.STORY.body,
          image_alt: HOME_CMS_DEFAULTS.STORY.imageAlt,
        },
      };
    case 'home.class_promo':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          title: HOME_CMS_DEFAULTS.CLASS_PROMO.title,
          body: HOME_CMS_DEFAULTS.CLASS_PROMO.body,
        },
      };
    case 'home.custom_business':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          title: CONTENT_DEFAULTS.CUSTOM_BUSINESS.title,
          body: CONTENT_DEFAULTS.CUSTOM_BUSINESS.body,
        },
      };
    case 'about.story':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          title: CONTENT_DEFAULTS.ABOUT_STORY.title,
          body: CONTENT_DEFAULTS.ABOUT_STORY.body,
        },
      };
    case 'about.values':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          items: [...CONTENT_DEFAULTS.ABOUT_VALUES],
        },
      };
    case 'footer.note':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          text: CONTENT_DEFAULTS.FOOTER_NOTE.text,
        },
      };
    case 'legal.privacy':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          title: CONTENT_DEFAULTS.LEGAL_PRIVACY.title,
          body: CONTENT_DEFAULTS.LEGAL_PRIVACY.body,
        },
      };
    case 'legal.ordering_policy':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          title: CONTENT_DEFAULTS.LEGAL_ORDERING_POLICY.title,
          body: CONTENT_DEFAULTS.LEGAL_ORDERING_POLICY.body,
        },
      };
    case 'community.instagram':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          url: HOME_CMS_DEFAULTS.INSTAGRAM.url,
          items: [],
        },
      };
    case 'promo.shipping_banner':
      return {
        key,
        source: 'template',
        updatedAt: null,
        content: {
          title: 'Informasi Ongkos Kirim',
          body: 'Ongkos kirim dikonfirmasi langsung oleh admin cabang melalui WhatsApp setelah pesanan disiapkan.',
        },
      };
  }
}

function resolveCmsEntry(
  key: PublicCmsKey,
  row:
    | {
        key: string;
        content_json: unknown;
        status: string;
        updated_at: string;
      }
    | undefined,
): PublicCmsEntry {
  if (!row || row.status !== 'published') {
    return publicCmsEntrySchema.parse(getTemplateEntryForKey(key));
  }
  const schema = cmsPayloadSchemasByKey[key];
  const parsed = schema.safeParse(row.content_json);
  if (!parsed.success) {
    return publicCmsEntrySchema.parse(getTemplateEntryForKey(key));
  }
  return publicCmsEntrySchema.parse({
    key,
    source: 'published',
    updatedAt: row.updated_at,
    content: parsed.data,
  });
}

export async function getPublicContent(
  input: unknown = {},
  signal?: AbortSignal,
): Promise<PublicContentDirectory> {
  const query = contentQuerySchema.parse(input);
  const requestedKeys = query.keys ?? [...PUBLIC_CMS_KEYS];
  const rows = await readPublishedSiteContentByKeys(requestedKeys, signal);
  const byKey = new Map(
    rows
      .filter((row) => row.status === 'published')
      .map((row) => [row.key, row]),
  );

  const items = requestedKeys.map((key) =>
    resolveCmsEntry(key, byKey.get(key)),
  );
  return publicContentDirectorySchema.parse({ items });
}

export async function getInitialPublicContent(
  keys: readonly PublicCmsKey[],
  signal?: AbortSignal,
): Promise<ContentInitial<PublicContentDirectory>> {
  try {
    return {
      status: 'success',
      data: await getPublicContent({ keys: keys.join(',') }, signal),
    };
  } catch {
    return { status: 'error' };
  }
}

export async function getPublicFaqs(
  signal?: AbortSignal,
): Promise<PublicFaqDirectory> {
  const rows = await readPublishedFaqs(signal);
  const items = rows
    .filter((row) => row.status === 'published')
    .flatMap((row) => {
      const parsed = publicFaqItemSchema.safeParse({
        id: row.id,
        category: row.category,
        question: row.question,
        answer: row.answer,
        sortOrder: row.sort_order,
      });
      return parsed.success ? [parsed.data] : [];
    });
  return publicFaqDirectorySchema.parse({ items });
}

export async function getInitialPublicFaqs(
  signal?: AbortSignal,
): Promise<ContentInitial<PublicFaqDirectory>> {
  try {
    return {
      status: 'success',
      data: await getPublicFaqs(signal),
    };
  } catch {
    return { status: 'error' };
  }
}

export async function getContactPageData(
  signal?: AbortSignal,
): Promise<ContactPageData> {
  const [branchesResult, hoursResult, contentResult] = await Promise.allSettled(
    [
      readActiveBranches(signal),
      readActiveBranchHours(signal),
      getPublicContent(
        { keys: 'business.contacts,home.custom_business' },
        signal,
      ),
    ],
  );

  const hoursByBranch = new Map<
    string,
    ReturnType<typeof publicBranchHourSchema.parse>[]
  >();
  if (hoursResult.status === 'fulfilled') {
    for (const row of hoursResult.value) {
      const parsed = publicBranchHourSchema.safeParse({
        id: row.id,
        branchId: row.branch_id,
        dayOfWeek: row.day_of_week,
        opensAt: row.opens_at,
        closesAt: row.closes_at,
        isClosed: row.is_closed,
        note: row.note,
      });
      if (parsed.success) {
        const list = hoursByBranch.get(parsed.data.branchId) ?? [];
        list.push(parsed.data);
        hoursByBranch.set(parsed.data.branchId, list);
      }
    }
  }

  let email: string = APPROVED_CONTACTS.email;
  let instagramUrl: string = APPROVED_CONTACTS.instagramUrl;
  let customBusiness: ContactPageData['customBusiness'] = {
    source: 'template',
    title: CONTENT_DEFAULTS.CUSTOM_BUSINESS.title,
    body: CONTENT_DEFAULTS.CUSTOM_BUSINESS.body,
  };

  if (contentResult.status === 'fulfilled') {
    for (const entry of contentResult.value.items) {
      if (entry.key === 'business.contacts') {
        email = entry.content.email;
        instagramUrl = entry.content.instagram_url;
      } else if (entry.key === 'home.custom_business') {
        customBusiness = {
          source: entry.source,
          title: entry.content.title,
          body: entry.content.body,
        };
      }
    }
  }

  const activeRows =
    branchesResult.status === 'fulfilled' ? branchesResult.value : [];
  const branches = APPROVED_CONTACTS.branches.map((fallback) => {
    const dbRow = activeRows.find((item) => item.code === fallback.code);
    if (dbRow) {
      return {
        id: dbRow.id,
        code: fallback.code,
        name: dbRow.name,
        city: dbRow.city,
        whatsappNumber: dbRow.whatsapp_number,
        address: dbRow.address,
        mapsUrl: dbRow.maps_url,
        hours: hoursByBranch.get(dbRow.id) ?? [],
      };
    }
    return {
      id: null,
      code: fallback.code,
      name: fallback.name,
      city: fallback.name,
      whatsappNumber: fallback.whatsappNumber,
      address: fallback.address,
      mapsUrl: null,
      hours: [],
    };
  });

  const status =
    branchesResult.status === 'fulfilled' &&
    hoursResult.status === 'fulfilled' &&
    contentResult.status === 'fulfilled'
      ? 'success'
      : 'fallback';

  return contactPageDataSchema.parse({
    status,
    email,
    instagramUrl,
    branches,
    customBusiness,
  });
}
