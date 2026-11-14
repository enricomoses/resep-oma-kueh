import { serializeJsonLd } from '@/utils/structured-data';

interface StructuredDataScriptProps {
  data: Record<string, unknown> | null;
}

export function StructuredDataScript({ data }: StructuredDataScriptProps) {
  if (!data) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
