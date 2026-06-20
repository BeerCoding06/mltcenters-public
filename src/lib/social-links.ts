export type SocialLink = {
  id: string;
  href: string;
  label: { en: string; th: string };
};

export const socialLinks: SocialLink[] = [
  {
    id: 'facebook',
    href: 'https://www.facebook.com/mltcenterbykrumam/',
    label: { en: 'Facebook', th: 'Facebook' },
  },
  {
    id: 'youtube',
    href: 'https://www.youtube.com/@Krumamclub',
    label: { en: 'YouTube', th: 'YouTube' },
  },
  {
    id: 'tiktok',
    href: 'https://www.tiktok.com/@krumamclub',
    label: { en: 'TikTok', th: 'TikTok' },
  },
];
