'use client';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';

interface AdminBranchFulfillmentBoxProps {
  allowPickup: boolean;
  allowDelivery: boolean;
  fulfillmentReviewed: boolean;
  reviewError?: string;
  onAllowPickupChange: (checked: boolean) => void;
  onAllowDeliveryChange: (checked: boolean) => void;
  onFulfillmentReviewedChange: (checked: boolean) => void;
}

/** Fulfillment mode switches (pickup/delivery) with mandatory owner production review check. */
export function AdminBranchFulfillmentBox({
  allowPickup,
  allowDelivery,
  fulfillmentReviewed,
  reviewError,
  onAllowPickupChange,
  onAllowDeliveryChange,
  onFulfillmentReviewedChange,
}: AdminBranchFulfillmentBoxProps) {
  return (
    <div className="admin-fulfillment-box">
      <p className="admin-row-title">Pengaturan Fulfillment</p>
      <p className="admin-section-subtitle">
        {ADMIN_CATALOG_COPY.LOCATIONS.FULFILLMENT_SAFETY_NOTE}
      </p>

      <div className="admin-inline-actions">
        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={allowPickup}
            onChange={(event) => onAllowPickupChange(event.target.checked)}
          />
          <span>Izinkan Pickup Cabang</span>
        </label>

        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={allowDelivery}
            onChange={(event) => onAllowDeliveryChange(event.target.checked)}
          />
          <span>Izinkan Delivery Cabang</span>
        </label>
      </div>

      {allowPickup || allowDelivery ? (
        <div className="admin-confirm-box">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={fulfillmentReviewed}
              onChange={(event) =>
                onFulfillmentReviewedChange(event.target.checked)
              }
            />
            <span>{ADMIN_CATALOG_COPY.LOCATIONS.FULFILLMENT_REVIEW_LABEL}</span>
          </label>
          {reviewError ? (
            <p className="admin-field-error">{reviewError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
