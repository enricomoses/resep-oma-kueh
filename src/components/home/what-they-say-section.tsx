import { MessageSquareQuote, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { HOME_COPY, HOME_SECTION_IDS } from '@/constants/home.constant';
import { cn } from '@/utils';
import type { HomeSectionResult, HomeTestimonial } from '@/types/home';

interface WhatTheySaySectionProps {
  testimonials: HomeSectionResult<HomeTestimonial[]>;
  className?: string;
}
export function WhatTheySaySection({
  testimonials,
  className,
}: WhatTheySaySectionProps) {
  return (
    <section
      id={HOME_SECTION_IDS.TESTIMONIALS}
      className={cn('home-section', className)}
      aria-labelledby="home-testimonials-title"
    >
      <div className="home-section-header">
        <div>
          <h2 id="home-testimonials-title" className="editorial-heading">
            {HOME_COPY.TESTIMONIALS_TITLE}
          </h2>
          <p className="home-section-subtitle">
            {HOME_COPY.TESTIMONIALS_SUBTITLE}
          </p>
        </div>
      </div>
      {testimonials.status === 'error' ? (
        <Feedback tone="error" title={HOME_COPY.TESTIMONIALS_ERROR} />
      ) : testimonials.data.length === 0 ? (
        <Feedback title={HOME_COPY.TESTIMONIALS_EMPTY} />
      ) : (
        <div className="home-testimonials-grid">
          {testimonials.data.map((testimonial) => (
            <Card key={testimonial.id} className="home-testimonial-card">
              <div className="home-testimonial-header">
                <MessageSquareQuote size={20} aria-hidden="true" />
                {testimonial.rating !== null ? (
                  <Badge tone="accent">
                    <Star size={14} aria-hidden="true" />
                    {testimonial.rating}/5
                  </Badge>
                ) : null}
              </div>
              <blockquote className="home-testimonial-quote">
                “{testimonial.quote}”
              </blockquote>
              <p className="home-testimonial-author">
                <strong>{testimonial.displayName}</strong> ·{' '}
                <span>{testimonial.sourceLabel}</span>
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
