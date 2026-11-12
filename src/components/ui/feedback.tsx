import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils';

interface FeedbackProps {
  tone?: 'info' | 'success' | 'error';
  title: string;
  children?: ReactNode;
  announce?: boolean;
  className?: string;
}
export function Feedback({
  tone = 'info',
  title,
  children,
  announce = false,
  className,
}: FeedbackProps) {
  const Icon =
    tone === 'error' ? CircleAlert : tone === 'success' ? CircleCheck : Info;
  return (
    <div
      className={cn(
        'ui-feedback',
        tone !== 'info' && `ui-feedback--${tone}`,
        className,
      )}
      role={announce ? (tone === 'error' ? 'alert' : 'status') : undefined}
    >
      <Icon size={20} aria-hidden="true" />
      <div>
        <p className="ui-feedback-title">{title}</p>
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
