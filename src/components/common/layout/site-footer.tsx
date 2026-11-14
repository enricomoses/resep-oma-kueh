'use client';

import {
  FaEnvelope,
  FaFileAlt,
  FaInstagram,
  FaMapMarkerAlt,
  FaQuestionCircle,
  FaShieldAlt,
  FaStore,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa';

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

const HELP_ICONS = [FaQuestionCircle, FaShieldAlt, FaFileAlt] as const;

const BRANCH_MAPS_URL: Record<string, string> = {
  sby: 'https://maps.app.goo.gl/59F3GMc62EU6dBGt6?g_st=ic',
  surabaya: 'https://maps.app.goo.gl/59F3GMc62EU6dBGt6?g_st=ic',
};

function formatWhatsappDisplay(number: string): string {
  return number.replace(/^62/, '0');
}

function formatInstagramHandle(url: string, fallback: string): string {
  const segment = url.split('?')[0]?.split('/').filter(Boolean).pop();
  return (segment || fallback).replace(/^@/, '');
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
        </div>
        {footerNote ? <p className="site-contact-note">{footerNote}</p> : null}
        {fallbackNotice ? (
          <p className="site-contact-note">{SITE_COPY.CONTACT_FALLBACK}</p>
        ) : null}
        <div className="site-contact-grid">
          {publicContacts.map((branch) => {
            const mapsUrl = BRANCH_MAPS_URL[branch.code.toLowerCase()];
            return (
              <section
                key={branch.code}
                className="site-contact-card"
                aria-label={`Kontak ${branch.name}`}
              >
                <h3 className="site-contact-title">
                  <FaStore className="site-contact-icon" aria-hidden="true" />
                  <span>{branch.name}</span>
                </h3>
                <a
                  className="site-contact-link"
                  href={`https://wa.me/${branch.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaWhatsapp className="site-contact-icon" aria-hidden="true" />
                  <span>{formatWhatsappDisplay(branch.whatsappNumber)}</span>
                </a>
                {branch.address ? (
                  mapsUrl ? (
                    <a
                      className="site-contact-address site-contact-address-link"
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaMapMarkerAlt
                        className="site-contact-icon"
                        aria-hidden="true"
                      />
                      <span>{branch.address}</span>
                    </a>
                  ) : (
                    <p className="site-contact-address">
                      <FaMapMarkerAlt
                        className="site-contact-icon"
                        aria-hidden="true"
                      />
                      <span>{branch.address}</span>
                    </p>
                  )
                ) : null}
              </section>
            );
          })}
          <section className="site-contact-card" aria-label="Kontak resmi">
            <h3 className="site-contact-title">
              <span>Kanal Resmi</span>
            </h3>
            <a
              className="site-contact-link"
              href={`mailto:${contacts.email}`}
            >
              <FaEnvelope className="site-contact-icon" aria-hidden="true" />
              <span>{contacts.email}</span>
            </a>
            <div className="site-contact-social-row">
              <a
                className="site-contact-link"
                href={contacts.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="site-contact-icon" aria-hidden="true" />
                <span>
                  {formatInstagramHandle(
                    contacts.instagramUrl,
                    SITE_COPY.INSTAGRAM,
                  )}
                </span>
              </a>
              <a
                className="site-contact-link"
                href="https://www.tiktok.com/@resepoma.kueh"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTiktok className="site-contact-icon" aria-hidden="true" />
                <span>resepoma.kueh</span>
              </a>
            </div>
          </section>
        </div>
        <div className="site-footer-bottom">
          <nav className="site-footer-links" aria-label="Bantuan dan kebijakan">
            {SITE_HELP.map((item, index) => {
              const Icon = HELP_ICONS[index % HELP_ICONS.length];
              return (
                <ActionLink
                  key={item.href}
                  href={withBranch(item.href, selected?.code ?? code)}
                  prefetch={false}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className="site-footer-help-link"
                >
                  <Icon className="site-footer-help-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                </ActionLink>
              );
            })}
          </nav>
          <p className="site-footer-copyright">
            &copy; {new Date().getFullYear()} {APP.NAME}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
