'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import type { PublicFaqDirectory } from '@/types/content';
import { cn } from '@/utils';

interface FaqAccordionProps {
  items: readonly PublicFaqDirectory['items'][number][];
  className?: string;
}

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const [selectedId, setSelectedId] = useState<string | null | undefined>(
    undefined,
  );
  const activeId =
    selectedId === undefined ? (items[0]?.id ?? null) : selectedId;

  return (
    <Card className={cn('content-faq-accordion-card', className)}>
      <div className="content-faq-accordion">
        {items.map((faq) => {
          const isOpen = activeId === faq.id;
          const buttonId = `faq-trigger-${faq.id}`;
          const panelId = `faq-panel-${faq.id}`;

          return (
            <div key={faq.id} className="content-faq-item">
              <h3 className="content-faq-heading">
                <button
                  id={buttonId}
                  type="button"
                  className="content-faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() =>
                    setSelectedId((current) => {
                      const currentOpen =
                        current === undefined
                          ? (items[0]?.id ?? null)
                          : current;
                      return currentOpen === faq.id ? null : faq.id;
                    })
                  }
                >
                  <span className="content-faq-question">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={cn('content-faq-chevron', isOpen && 'is-open')}
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!isOpen}
                data-open={isOpen ? 'true' : 'false'}
                className="content-faq-panel"
              >
                <div className="content-faq-panel-inner">
                  <div className="content-faq-panel-body">
                    <p className="content-faq-answer">{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
