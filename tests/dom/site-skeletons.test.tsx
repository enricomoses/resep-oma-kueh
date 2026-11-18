import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SiteAboutSkeleton } from '@/app/(site)/_components/skeletons/site-about-skeleton';
import { SiteCartSkeleton } from '@/app/(site)/_components/skeletons/site-cart-skeleton';
import { SiteCheckoutSkeleton } from '@/app/(site)/_components/skeletons/site-checkout-skeleton';
import { SiteClassDetailSkeleton } from '@/app/(site)/_components/skeletons/site-class-detail-skeleton';
import { SiteClassesSkeleton } from '@/app/(site)/_components/skeletons/site-classes-skeleton';
import { SiteContactSkeleton } from '@/app/(site)/_components/skeletons/site-contact-skeleton';
import { SiteFaqSkeleton } from '@/app/(site)/_components/skeletons/site-faq-skeleton';
import { SiteHomeSkeleton } from '@/app/(site)/_components/skeletons/site-home-skeleton';
import { SiteLegalPolicySkeleton } from '@/app/(site)/_components/skeletons/site-legal-policy-skeleton';
import { SiteMenuSkeleton } from '@/app/(site)/_components/skeletons/site-menu-skeleton';
import { SiteProductDetailSkeleton } from '@/app/(site)/_components/skeletons/site-product-detail-skeleton';
import { CheckoutView } from '@/app/(site)/checkout/_components/checkout-view';
import { MenuResultsSection } from '@/app/(site)/menu/_components/menu-results-section';
import { ProductDetailView } from '@/app/(site)/menu/[slug]/_components/product-detail-view';
import { CART_COPY } from '@/constants/cart.constant';
import { BOUNDARY_COPY } from '@/constants/seo.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { BranchProvider } from '@/providers/branch-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { branchesService } from '@/services/branches.service';
import { catalogService } from '@/services/catalog.service';
import type { PublicBranch } from '@/types/branch';
import type { ProductDetail } from '@/types/catalog';

vi.mock('next/navigation', () => ({
  usePathname: () => '/menu/demo-coffee',
  useSearchParams: () => new URLSearchParams('branch=surabaya'),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/hooks/use-cart', () => ({
  useCart: () => ({
    hasHydrated: false,
    lines: [{ id: '1', variantId: 'v1', choiceIds: [], quantity: 1 }],
    totalQuantity: 1,
    updateQuantity: vi.fn(),
    removeLine: vi.fn(),
    clearCart: vi.fn(),
    isValidating: true,
    isValidationError: false,
    validatedLines: [],
    estimatedSubtotalIdr: 0,
    totalDiscountIdr: 0,
    estimatedTotalIdr: 0,
    hasBlockingConflicts: false,
    refetchValidation: vi.fn(),
  }),
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

const MINIMAL_DETAIL: ProductDetail = {
  id: 'f0400000-0000-4000-8000-000000000400',
  name: 'Coffee Chiffon',
  slug: 'demo-coffee',
  shortDescription: 'Chiffon klasik.',
  description: 'Deskripsi produk.',
  ingredientsInfo: null,
  storageInstructions: null,
  productType: 'variants',
  isFeatured: true,
  isBestSeller: false,
  isNew: false,
  primaryCategory: {
    id: 'f0400000-0000-4000-8000-000000000200',
    name: 'Chiffon Series',
    slug: 'chiffon-series',
  },
  categories: [],
  images: [],
  resolvedBranchId: null,
  resolvedBranchCode: null,
  activeVariantCount: 1,
  offeredVariants: [],
  relatedProducts: [],
};

function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  vi.spyOn(branchesService, 'getAll').mockResolvedValue({
    ok: true,
    data: { items: [SURABAYA], resolvedBranchId: SURABAYA.id },
    requestId: 'skel-branch-req',
  });
  return render(
    <QueryClientProvider client={client}>
      <BranchProvider
        initial={{
          status: 'success',
          data: { items: [SURABAYA], resolvedBranchId: SURABAYA.id },
        }}
      >
        <ToastProvider>{ui}</ToastProvider>
      </BranchProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Public site route skeletons', () => {
  it.each([
    {
      name: 'Home',
      ui: <SiteHomeSkeleton />,
      selectors: [
        '.home-main',
        '.home-hero',
        '.home-series-grid',
        '.home-featured-grid',
        '.home-story-grid',
        '.home-treats-grid',
        '.baking-class-grid',
        '.home-testimonials-grid',
        '.home-find-us-grid',
        '.home-community-grid',
      ],
    },
    {
      name: 'Menu',
      ui: <SiteMenuSkeleton />,
      selectors: [
        '.menu-page-main',
        '.menu-toolbar-mobile',
        '.menu-layout-grid',
        '.menu-sidebar-desktop .menu-filter-card',
        '.menu-product-grid',
        '.menu-pagination',
      ],
    },
    {
      name: 'Product Detail',
      ui: <SiteProductDetailSkeleton />,
      selectors: [
        '.product-detail-page',
        '.product-detail-main-grid',
        '.product-gallery',
        '.product-picker-card',
        '.product-food-info-card',
        '.product-detail-faq-banner',
        '.product-detail-related .product-grid',
      ],
    },
    {
      name: 'Classes',
      ui: <SiteClassesSkeleton />,
      selectors: [
        '.classes-main',
        '.classes-hero-header',
        '.baking-class-grid',
      ],
    },
    {
      name: 'Class Detail',
      ui: <SiteClassDetailSkeleton />,
      selectors: [
        '.classes-main',
        '.classes-back-row',
        '.classes-detail-layout',
        '.classes-detail-hero-card',
        '.classes-sessions-card',
        '.classes-register-card',
      ],
    },
    {
      name: 'Cart',
      ui: <SiteCartSkeleton />,
      selectors: [
        '.cart-page',
        '.cart-header',
        '.cart-main-grid',
        '.cart-item-card',
        '.cart-summary-card',
      ],
    },
    {
      name: 'Checkout',
      ui: <SiteCheckoutSkeleton />,
      selectors: [
        '.checkout-page',
        '.checkout-header',
        '.checkout-main-grid',
        '.checkout-form-card',
        '.checkout-sidebar-items',
        '.cart-summary-card',
      ],
    },
    {
      name: 'About',
      ui: <SiteAboutSkeleton />,
      selectors: [
        '.content-page-main',
        '.content-values-grid',
        '.content-team-card',
      ],
    },
    {
      name: 'Contact',
      ui: <SiteContactSkeleton />,
      selectors: [
        '.content-page-main',
        '.home-find-us-grid',
        '.content-branch-card',
        '.content-b2b-card',
        '.content-channels-grid',
      ],
    },
    {
      name: 'FAQ',
      ui: <SiteFaqSkeleton />,
      selectors: [
        '.content-page-main',
        '.content-faq-accordion-card',
        '.content-privacy-grid--3',
      ],
    },
    {
      name: 'Privacy Policy',
      ui: <SiteLegalPolicySkeleton factCount={4} />,
      selectors: [
        '.content-page-main',
        '.content-legal-card',
        '.content-privacy-grid',
        '.content-legal-actions',
      ],
    },
    {
      name: 'Ordering Policy',
      ui: <SiteLegalPolicySkeleton factCount={3} />,
      selectors: [
        '.content-page-main',
        '.content-legal-card',
        '.content-privacy-grid--3',
        '.content-legal-actions',
      ],
    },
  ])(
    'renders accessible <main> landmark and 1:1 structure for $name',
    ({ ui, selectors }) => {
      const { container } = render(ui);
      const main = container.querySelector(`main#${SITE_COPY.MAIN_ID}`);
      expect(main).not.toBeNull();
      expect(main).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status')).toHaveTextContent(
        BOUNDARY_COPY.LOADING_LABEL,
      );
      expect(container.querySelectorAll('.ui-skeleton').length).toBeGreaterThan(
        0,
      );

      for (const selector of selectors) {
        expect(
          container.querySelector(selector),
          `Expected selector "${selector}" to exist`,
        ).not.toBeNull();
      }
    },
  );

  it('renders client-side skeletons while queries or cart hydration are pending', () => {
    const never = () => new Promise<never>(() => {});
    vi.spyOn(catalogService, 'getBySlug').mockImplementation(never);

    const { container: menuContainer, unmount: unmountMenu } = render(
      <MenuResultsSection
        catalogData={undefined}
        isCatalogLoading
        isCatalogError={false}
        hasBranchSelected={false}
        branchCode={null}
        onRetry={vi.fn()}
        onResetFilters={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(menuContainer.querySelector('.menu-product-grid')).not.toBeNull();
    expect(menuContainer.querySelectorAll('.menu-product-card')).toHaveLength(
      6,
    );
    unmountMenu();

    const { container: detailContainer, unmount: unmountDetail } =
      renderWithProviders(
        <ProductDetailView
          slug="demo-coffee"
          initial={{ status: 'success', data: MINIMAL_DETAIL }}
        />,
      );
    expect(
      detailContainer.querySelector('.product-detail-main-grid'),
    ).not.toBeNull();
    unmountDetail();

    const { container: checkoutContainer } = renderWithProviders(
      <CheckoutView />,
    );
    expect(
      checkoutContainer.querySelector('.checkout-main-grid'),
    ).not.toBeNull();
    expect(screen.getByText(CART_COPY.LOADING_RESTORE)).toBeInTheDocument();
  });
});
