export type CmsLink = { label: string; href: string };
export type CmsStat = { label: string; value: string };
export type CmsService = {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  startingPrice: string;
  duration: string;
  active: boolean;
};
export type CmsPricing = { name: string; price: string; features: string[]; highlighted?: boolean };
export type CmsProcess = { step: string; title: string; description: string };
export type CmsTestimonial = { id: string; name: string; business: string; message: string; rating: number; published: boolean };
export type CmsFaq = { id: string; question: string; answer: string; published: boolean };
export type CmsTeamMember = { id: string; name: string; role: string; bio: string; image: string; skills: string[]; active: boolean };

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    whatsapp: string;
    email: string;
    address: string;
    socials: { instagram: string; tiktok: string; github: string; website: string; youtube: string };
  };
  navigation: {
    links: CmsLink[];
    trackOrderLabel: string;
    startProjectLabel: string;
  };
  hero: {
    visible: boolean;
    eyebrow: string;
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaPrimaryHref: string;
    ctaSecondary: string;
    ctaSecondaryHref: string;
    badges: string[];
  };
  stats: { visible: boolean; items: CmsStat[] };
  services: { visible: boolean; title: string; subtitle: string; items: CmsService[] };
  featured: { visible: boolean; badge: string; title: string; subtitle: string };
  portfolio: {
    visible: boolean;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyText: string;
    resetLabel: string;
    featuredLabel: string;
    demoLabel: string;
    detailLabel: string;
    orderLabel: string;
    backLabel: string;
    fullscreenLabel: string;
  };
  whyChoose: { visible: boolean; title: string; description: string; items: string[]; showProcessPreview: boolean };
  pricing: { visible: boolean; title: string; subtitle: string; items: CmsPricing[] };
  process: { visible: boolean; title: string; subtitle: string; items: CmsProcess[] };
  testimonials: {
    visible: boolean;
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyText: string;
    items: CmsTestimonial[];
  };
  faq: { visible: boolean; eyebrow: string; title: string; subtitle: string; items: CmsFaq[] };
  team: { visible: boolean; title: string; subtitle: string; items: CmsTeamMember[] };
  about: {
    title: string;
    lead: string;
    paragraphs: string[];
    principlesTitle: string;
    principles: string[];
  };
  contact: {
    title: string;
    subtitle: string;
    whatsappTitle: string;
    whatsappDescription: string;
    emailTitle: string;
    emailDescription: string;
    instagramTitle: string;
    instagramDescription: string;
    githubTitle: string;
    githubDescription: string;
  };
  cta: {
    visible: boolean;
    title: string;
    subtitle: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  footer: {
    description: string;
    copyright: string;
    navigationTitle: string;
    accountTitle: string;
    showCustomerLogin: boolean;
    showAdminLogin: boolean;
    showLegalIdentity: boolean;
    legalTitle: string;
    legalDescription: string;
    nib: string;
  };
  seo: {
    siteTitle: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
    areaServed: string;
    priceRange: string;
    pages: Record<string, { title: string; description: string }>;
  };
}

export type SiteContentSection = keyof SiteContent;
