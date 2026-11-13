import { CHECKOUT_COPY, CHECKOUT_LIMITS } from '@/constants/checkout.constant';
import { formatIdr } from '@/utils/currency';

const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export function formatJakartaDateIso(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatJakartaDateLong(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (month < 1 || month > 12) return dateStr;
  const monthName = INDONESIAN_MONTH_NAMES[month - 1];
  return `${day} ${monthName} ${year}`;
}

export function isValidJakartaDate(
  dateStr: string,
  now: Date = new Date(),
  maxDaysAhead: number = CHECKOUT_LIMITS.MAX_DAYS_IN_ADVANCE,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Verify real calendar day existence (e.g. Reject 2026-02-29 or 2026-04-31)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) {
    return false;
  }

  const todayJakarta = formatJakartaDateIso(now);
  if (dateStr < todayJakarta) {
    return false;
  }

  const maxDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);
  const maxDateJakarta = formatJakartaDateIso(maxDate);
  if (dateStr > maxDateJakarta) {
    return false;
  }

  return true;
}

export function sanitizeUserInput(input: string | null | undefined): string {
  if (!input) return '';
  return (
    input
      // Strip control characters except newline and tab
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Strip WhatsApp markdown formatting and HTML brackets to avoid injection
      .replace(/[*_~`<>\\]/g, '')
      .trim()
  );
}

export interface ComposeWhatsAppMessageParams {
  branchName: string;
  lines: Array<{
    productName: string;
    variantName: string;
    sizeLabel?: string | null;
    quantity: number;
    unitPriceIdr: number;
    lineTotalIdr: number;
    options?: Array<{ label: string; priceDeltaIdr?: number }>;
    bundleBreakdown?: Array<{
      slotOrGroup: string;
      label: string;
      quantity: number;
      priceDeltaIdr?: number;
      isFixed?: boolean;
    }>;
  }>;
  subtotalIdr: number;
  discountIdr: number;
  estimatedTotalIdr: number;
  customerName: string;
  fulfillmentMethod: 'delivery' | 'pickup';
  requestedDate: string;
  requestedTimeWindow?: string | null;
  deliveryAddress?: string | null;
  note?: string | null;
}

export function composeWhatsAppMessage(
  params: ComposeWhatsAppMessageParams,
): string {
  const sanitizedBranch = sanitizeUserInput(params.branchName);
  const sanitizedCustomer = sanitizeUserInput(params.customerName);
  const sanitizedAddress = sanitizeUserInput(params.deliveryAddress);
  const sanitizedNote = sanitizeUserInput(params.note);
  const formattedDate = formatJakartaDateLong(params.requestedDate);
  const timeWindowStr = params.requestedTimeWindow
    ? ` (${sanitizeUserInput(params.requestedTimeWindow)})`
    : '';

  const orderLines: string[] = [];
  params.lines.forEach((line, index) => {
    const itemNum = index + 1;
    const label = line.sizeLabel || line.variantName;
    const itemHeader = `${itemNum}. ${line.productName} — ${label}`;
    const calcLine = `   ${line.quantity} × ${formatIdr(line.unitPriceIdr)} = ${formatIdr(line.lineTotalIdr)}`;

    const details: string[] = [itemHeader, calcLine];

    if (line.bundleBreakdown && line.bundleBreakdown.length > 0) {
      line.bundleBreakdown.forEach((b) => {
        const isFixed =
          b.isFixed ??
          (b.slotOrGroup === 'fixed' ||
            b.slotOrGroup.toLowerCase().includes('tetap') ||
            b.slotOrGroup.toLowerCase().includes('fixed'));
        const badge = isFixed ? ' [Termasuk]' : '';
        const delta =
          b.priceDeltaIdr && b.priceDeltaIdr > 0
            ? ` (+${formatIdr(b.priceDeltaIdr)})`
            : '';
        details.push(`   • ${b.label} (${b.quantity} potong)${badge}${delta}`);
      });
    } else if (line.options && line.options.length > 0) {
      line.options.forEach((opt) => {
        const delta =
          opt.priceDeltaIdr && opt.priceDeltaIdr > 0
            ? ` (+${formatIdr(opt.priceDeltaIdr)})`
            : '';
        details.push(`   • ${opt.label}${delta}`);
      });
    }

    orderLines.push(details.join('\n'));
  });

  const detailPesanan = orderLines.join('\n');
  const methodLabel =
    params.fulfillmentMethod === 'delivery'
      ? CHECKOUT_COPY.METHOD_DELIVERY_LABEL
      : CHECKOUT_COPY.METHOD_PICKUP_LABEL;

  const fulfillmentDetails: string[] = [
    `*PEMESAN:* ${sanitizedCustomer}`,
    `*METODE:* ${methodLabel}`,
    `*TANGGAL:* ${formattedDate}${timeWindowStr}`,
  ];

  if (params.fulfillmentMethod === 'delivery' && sanitizedAddress) {
    fulfillmentDetails.push(`*ALAMAT:* ${sanitizedAddress}`);
  }

  if (sanitizedNote) {
    fulfillmentDetails.push(`*CATATAN:* ${sanitizedNote}`);
  }

  return [
    CHECKOUT_COPY.GREETING,
    CHECKOUT_COPY.INTRO,
    '',
    `*CABANG:* ${sanitizedBranch}`,
    '*DETAIL PESANAN:*',
    detailPesanan,
    '',
    `Subtotal: ${formatIdr(params.subtotalIdr)}`,
    `Diskon: ${formatIdr(params.discountIdr)}`,
    `*ESTIMASI TOTAL: ${formatIdr(params.estimatedTotalIdr)}*`,
    `Ongkir: ${CHECKOUT_COPY.SHIPPING_PENDING_LABEL}`,
    '',
    fulfillmentDetails.join('\n'),
    '',
    CHECKOUT_COPY.CLOSING,
  ].join('\n');
}

export function formatWhatsappDigits(rawWhatsappNumber: string): string {
  const digits = rawWhatsappNumber.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppUrl(
  rawWhatsappNumber: string,
  message: string,
  maxUrlLength: number = CHECKOUT_LIMITS.MAX_URL_LENGTH,
): { whatsappUrl: string; requiresCopy: boolean } {
  const digits = formatWhatsappDigits(rawWhatsappNumber);
  const encodedMessage = encodeURIComponent(message);
  const fullUrl = `https://wa.me/${digits}?text=${encodedMessage}`;

  if (fullUrl.length > maxUrlLength) {
    return {
      whatsappUrl: `https://wa.me/${digits}`,
      requiresCopy: true,
    };
  }

  return {
    whatsappUrl: fullUrl,
    requiresCopy: false,
  };
}
