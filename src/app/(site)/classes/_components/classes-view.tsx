'use client';

import { MapPin, MessageCircle } from 'lucide-react';

import { EmptyState } from '@/components/common/feedback/empty-state';
import { PageHeader } from '@/components/common/layout/page-header';
import { ActionLink } from '@/components/ui/action-link';
import { Badge } from '@/components/ui/badge';
import { Feedback } from '@/components/ui/feedback';
import { CLASSES_COPY } from '@/constants/classes.constant';
import { ROUTES } from '@/constants/routes.constant';
import { SITE_COPY } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import { usePublicClasses } from '@/hooks/use-classes';
import type { PublicClassesListData } from '@/types/classes';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';
import { buildAskNextClassWhatsAppUrl } from '@/utils/classes';
import { ClassProgramCard } from './class-program-card';

export type InitialPublicClasses =
  { status: 'success'; data: PublicClassesListData } | { status: 'error' };

interface ClassesViewProps {
  initial: InitialPublicClasses;
  className?: string;
}

export function ClassesView({ initial, className }: ClassesViewProps) {
  const { selected, code, items: activeBranches } = useBranches();
  const branchCode = selected?.code ?? code;

  const query = usePublicClasses(
    branchCode,
    initial.status === 'success' ? initial.data : undefined,
  );

  const data = query.data;
  const contactBranch = selected ?? activeBranches[0] ?? null;

  return (
    <main
      id={SITE_COPY.MAIN_ID}
      tabIndex={-1}
      className={cn('content-container classes-main', className)}
    >
      <PageHeader
        className="classes-hero-header"
        badges={<Badge tone="accent">{CLASSES_COPY.EYEBROW}</Badge>}
        title={CLASSES_COPY.TITLE}
        titleClassName="editorial-heading"
        subtitle={CLASSES_COPY.SUBTITLE}
        subtitleClassName="classes-subtitle"
      >
        <p className="classes-policy-note">
          {CLASSES_COPY.NO_FALSE_DATES_NOTE}
        </p>
        {selected ? (
          <Badge tone="success">
            <MapPin size={14} aria-hidden="true" />
            Cabang terpilih: {selected.name}
          </Badge>
        ) : (
          <Badge tone="neutral">
            Menampilkan jadwal dari seluruh cabang aktif
          </Badge>
        )}
      </PageHeader>

      <Feedback tone="info" title={CLASSES_COPY.CAPACITY_DISCLAIMER} />

      {query.isError || (!data && initial.status === 'error') ? (
        <Feedback tone="error" title={CLASSES_COPY.ERROR_LOAD}>
          <div className="classes-inline-actions">
            <ActionLink
              href={withBranch(ROUTES.CONTACT, branchCode)}
              variant="secondary"
              prefetch={false}
            >
              {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
            </ActionLink>
          </div>
        </Feedback>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          tone="cream"
          className="classes-empty-card"
          title={CLASSES_COPY.EMPTY_PROGRAMS_TITLE}
          description={CLASSES_COPY.EMPTY_PROGRAMS_BODY}
          action={
            <div className="classes-inline-actions">
              {contactBranch ? (
                <a
                  href={buildAskNextClassWhatsAppUrl(
                    contactBranch.whatsappNumber,
                    contactBranch.name,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-burgundy)] px-5 py-2.5 text-sm font-medium text-white"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
                </a>
              ) : (
                <ActionLink
                  href={withBranch(ROUTES.CONTACT, branchCode)}
                  variant="primary"
                  prefetch={false}
                >
                  {CLASSES_COPY.ASK_NEXT_CLASS_CTA}
                </ActionLink>
              )}
            </div>
          }
        />
      ) : (
        <div className="classes-program-grid">
          {data.items.map((program) => (
            <ClassProgramCard
              key={program.id}
              program={program}
              evaluatedAtUtc={data.evaluatedAtUtc}
              branchCode={branchCode}
              contactBranch={contactBranch}
            />
          ))}
        </div>
      )}
    </main>
  );
}
