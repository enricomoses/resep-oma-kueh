import 'server-only';

// PRD §3.1/27.1 + F04 reviewed manifest. Contacts only, never operational truth.
export const APPROVED_CONTACTS = {
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
