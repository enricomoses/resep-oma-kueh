'use client';

import { useEffect } from 'react';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { ROUTES } from '@/constants/routes.constant';

interface AdminErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorBoundary({
  error,
  reset,
}: AdminErrorBoundaryProps) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <section className="admin-auth-page">
      <div className="content-container admin-auth-container">
        <Card className="admin-auth-card" tone="surface">
          <Feedback
            tone="error"
            title="Layanan autentikasi admin sedang bermasalah"
            announce
          >
            <p>
              Terjadi gangguan sementara saat memverifikasi sesi atau profil
              admin. Silakan coba lagi beberapa saat.
            </p>
          </Feedback>
          <div className="admin-auth-actions">
            <Button type="button" onClick={reset}>
              Coba Lagi
            </Button>
            <ActionLink href={ROUTES.ADMIN_LOGIN} variant="secondary">
              Ke Halaman Masuk
            </ActionLink>
          </div>
        </Card>
      </div>
    </section>
  );
}
