import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils';

interface InfoCardProps {
  title: string;
  description: ReactNode;
  badges?: ReactNode;
  footer?: ReactNode;
  tone?: 'surface' | 'cream';
  headingAs?: 'h2' | 'h3' | 'h4';
  className?: string;
}

export function InfoCard({
  title,
  description,
  badges,
  footer,
  tone = 'surface',
  headingAs = 'h3',
  className,
}: InfoCardProps) {
  const Heading = headingAs;

  return (
    <Card tone={tone} className={cn(className)}>
      {badges ? <div className="home-badge-row">{badges}</div> : null}
      <Heading>{title}</Heading>
      {typeof description === 'string' ? <p>{description}</p> : description}
      {footer ?? null}
    </Card>
  );
}
