'use client';

import { ActionLink } from '@/components/ui/action-link';
import { APP } from '@/constants';
import { SITE_COPY, SITE_HELP } from '@/constants/site.constant';
import { useBranches } from '@/hooks/use-branches';
import type { ApprovedContacts } from '@/types/branch';
import { cn } from '@/utils';
import { withBranch } from '@/utils/branch-url';

interface SiteFooterProps {
  contacts: ApprovedContacts;
  initialUnavailable: boolean;
  footerNote?: string | null;
  className?: string;
}

export function SiteFooter({
  contacts,
  initialUnavailable,
  footerNote,
  className,
}: SiteFooterProps) {
  const { selected, code, items, isError, isPending, pathname } = useBranches();
  const publicContacts = contacts.branches.map((fallback) => {
    const active = !isError
      ? items.find((branch) => branch.code === fallback.code)
      : undefined;
    return active
      ? {
          code: active.code,
          name: active.name,
          whatsappNumber: active.whatsappNumber,
          address: active.address,
        }
      : fallback;
  });
  const fallbackNotice =
    isError ||
    (initialUnavailable && isPending) ||
    (!isPending &&
      contacts.branches.some(
        (branch) => !items.some((item) => item.code === branch.code),
      ));

  return (
    <footer className={cn('site-footer', className)}>
      <div className="content-container">
        <div className="site-footer-heading">
          <h2>{SITE_COPY.CONTACTS}</h2>
          <p>{APP.NAME}</p>
        </div>
        {footerNote ? <p className="site-contact-note">{footerNote}</p> : null}
        {fallbackNotice ? (
          <p className="site-contact-note">{SITE_COPY.CONTACT_FALLBACK}</p>
        ) : null}
        <div className="site-contact-grid">
          {publicContacts.map((branch) => (
            <section key={branch.code} aria-label={`Kontak ${branch.name}`}>
              <h3>{branch.name}</h3>
              <a href={`https://wa.me/${branch.whatsappNumber}`}>
                WhatsApp {branch.name}
              </a>
              <p>{branch.address ?? SITE_COPY.ADDRESS_PENDING}</p>
            </section>
          ))}
          <section aria-label="Kontak resmi">
            <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
            <a href={contacts.instagramUrl}>{SITE_COPY.INSTAGRAM}</a>
          </section>
        </div>
        <nav className="site-footer-links" aria-label="Bantuan dan kebijakan">
          {SITE_HELP.map((item) => (
            <ActionLink
              key={item.href}
              href={withBranch(item.href, selected?.code ?? code)}
              prefetch={false}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </ActionLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
