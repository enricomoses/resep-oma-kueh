import { Button } from '@/components/ui/button';
import { CATALOG_COPY } from '@/constants/catalog.constant';
import { cn } from '@/utils';

interface MenuPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  className?: string;
}

export function MenuPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: MenuPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={CATALOG_COPY.PAGINATION_NAV_LABEL}
      className={cn('menu-pagination', className)}
    >
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        {CATALOG_COPY.PAGINATION_PREV}
      </Button>
      <span className="menu-pagination-indicator" aria-live="polite">
        {CATALOG_COPY.PAGINATION_INDICATOR(page, totalPages)}
      </span>
      <Button
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        {CATALOG_COPY.PAGINATION_NEXT}
      </Button>
    </nav>
  );
}
