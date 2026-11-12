'use client';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  CATALOG_AVAILABILITY,
  CATALOG_AVAILABILITY_LABELS,
  CATALOG_COPY,
  CATALOG_DIETARY_TAG_OPTIONS,
  CATALOG_LIMITS,
  CATALOG_SORT_LABELS,
  CATALOG_SORTS,
} from '@/constants/catalog.constant';
import { cn } from '@/utils';
import type { PublicCategory } from '@/types/catalog';

export interface MenuFilterState {
  searchDraft: string;
  category: string;
  tag: string;
  availability: string;
  minPriceDraft: string;
  maxPriceDraft: string;
  sort: (typeof CATALOG_SORTS)[number];
}

interface MenuFilterPanelProps {
  idPrefix: string;
  categories: readonly PublicCategory[];
  hasBranchSelected: boolean;
  filters: MenuFilterState;
  priceError?: string;
  onSearchDraftChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onAvailabilityChange: (value: string) => void;
  onMinPriceDraftChange: (value: string) => void;
  onMaxPriceDraftChange: (value: string) => void;
  onApplyPriceRange: () => void;
  onSortChange: (value: (typeof CATALOG_SORTS)[number]) => void;
  onResetFilters: () => void;
  className?: string;
}

export function MenuFilterPanel({
  idPrefix,
  categories,
  hasBranchSelected,
  filters,
  priceError,
  onSearchDraftChange,
  onCategoryChange,
  onTagChange,
  onAvailabilityChange,
  onMinPriceDraftChange,
  onMaxPriceDraftChange,
  onApplyPriceRange,
  onSortChange,
  onResetFilters,
  className,
}: MenuFilterPanelProps) {
  return (
    <div className={cn('menu-filter-panel', className)}>
      <FormField id={`${idPrefix}-search`} label={CATALOG_COPY.SEARCH_LABEL}>
        {(props) => (
          <Input
            {...props}
            type="search"
            maxLength={CATALOG_LIMITS.MAX_SEARCH_LENGTH}
            placeholder={CATALOG_COPY.SEARCH_PLACEHOLDER}
            value={filters.searchDraft}
            onChange={(event) => onSearchDraftChange(event.target.value)}
          />
        )}
      </FormField>

      <FormField
        id={`${idPrefix}-category`}
        label={CATALOG_COPY.CATEGORY_LABEL}
      >
        {(props) => (
          <Select
            {...props}
            value={filters.category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">{CATALOG_COPY.CATEGORY_ALL}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField id={`${idPrefix}-tag`} label={CATALOG_COPY.TAG_LABEL}>
        {(props) => (
          <Select
            {...props}
            value={filters.tag}
            onChange={(event) => onTagChange(event.target.value)}
          >
            <option value="">{CATALOG_COPY.TAG_ALL}</option>
            {CATALOG_DIETARY_TAG_OPTIONS.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.label}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <FormField
        id={`${idPrefix}-availability`}
        label={CATALOG_COPY.AVAILABILITY_LABEL}
        helper={
          hasBranchSelected
            ? undefined
            : CATALOG_COPY.BRANCH_FILTER_REQUIRES_SELECTION
        }
      >
        {(props) => (
          <Select
            {...props}
            value={filters.availability}
            disabled={!hasBranchSelected}
            onChange={(event) => onAvailabilityChange(event.target.value)}
          >
            <option value="">{CATALOG_COPY.AVAILABILITY_ALL}</option>
            {CATALOG_AVAILABILITY.map((status) => (
              <option key={status} value={status}>
                {CATALOG_AVAILABILITY_LABELS[status]}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <div className="menu-price-filter-group">
        <FormField
          id={`${idPrefix}-min-price`}
          label={CATALOG_COPY.MIN_PRICE_LABEL}
          error={priceError}
        >
          {(props) => (
            <Input
              {...props}
              type="text"
              inputMode="numeric"
              placeholder={CATALOG_COPY.PRICE_PLACEHOLDER_MIN}
              disabled={!hasBranchSelected}
              value={filters.minPriceDraft}
              onChange={(event) =>
                onMinPriceDraftChange(event.target.value.replace(/[^\d]/g, ''))
              }
            />
          )}
        </FormField>

        <FormField
          id={`${idPrefix}-max-price`}
          label={CATALOG_COPY.MAX_PRICE_LABEL}
        >
          {(props) => (
            <Input
              {...props}
              type="text"
              inputMode="numeric"
              placeholder={CATALOG_COPY.PRICE_PLACEHOLDER_MAX}
              disabled={!hasBranchSelected}
              value={filters.maxPriceDraft}
              onChange={(event) =>
                onMaxPriceDraftChange(event.target.value.replace(/[^\d]/g, ''))
              }
            />
          )}
        </FormField>

        <Button
          variant="secondary"
          disabled={!hasBranchSelected}
          onClick={onApplyPriceRange}
        >
          {CATALOG_COPY.APPLY_PRICE_CTA}
        </Button>
      </div>

      <FormField id={`${idPrefix}-sort`} label={CATALOG_COPY.SORT_LABEL}>
        {(props) => (
          <Select
            {...props}
            value={filters.sort}
            onChange={(event) =>
              onSortChange(event.target.value as (typeof CATALOG_SORTS)[number])
            }
          >
            {CATALOG_SORTS.map((sortKey) => (
              <option key={sortKey} value={sortKey}>
                {CATALOG_SORT_LABELS[sortKey]}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      <Button variant="ghost" onClick={onResetFilters}>
        {CATALOG_COPY.RESET_FILTERS}
      </Button>
    </div>
  );
}
