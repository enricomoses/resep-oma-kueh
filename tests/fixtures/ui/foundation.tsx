import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Drawer } from '@/components/ui/drawer';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Quantity } from '@/components/ui/quantity';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Limited browser fixture: no customer data, storage, APIs, or production route.
function FoundationFixture() {
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [nested, setNested] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const initial = useRef<HTMLInputElement>(null);
  return (
    <main className="content-container" style={{ paddingBlock: '2rem' }}>
      <h1 className="editorial-heading">Fixture interaksi DEMO</h1>
      <div
        style={{
          marginBlock: '2rem',
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
        }}
      >
        <Card>
          <Badge tone="accent">DEMO</Badge>
          <h2>Form pratinjau</h2>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const valid = String(data.get('name') ?? '').trim().length > 0;
              setError(valid ? '' : 'Isi nama contoh.');
              setSaved(valid);
            }}
            style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}
          >
            <FormField
              label="Nama contoh"
              helper="Gunakan data DEMO, bukan data pribadi."
              required
              error={error}
            >
              {(props) => (
                <Input {...props} name="name" placeholder="Contoh DEMO" />
              )}
            </FormField>
            <FormField
              label="Pilihan contoh"
              helper="Pilihan ini hanya fixture."
            >
              {(props) => (
                <Select {...props} defaultValue="a">
                  <option value="a">Pilihan A</option>
                  <option value="b">Pilihan B</option>
                </Select>
              )}
            </FormField>
            <FormField label="Catatan contoh">
              {(props) => <Textarea {...props} placeholder="Catatan DEMO" />}
            </FormField>
            <Button type="submit">Periksa contoh</Button>
            {saved ? (
              <Feedback tone="success" title="Contoh valid" announce>
                Tidak ada data yang dikirim atau disimpan.
              </Feedback>
            ) : null}
          </form>
        </Card>
        <Card tone="cream">
          <h2>Jumlah contoh</h2>
          <Quantity
            value={quantity}
            max={3}
            onChange={setQuantity}
            label="jumlah contoh"
          />
          <p>
            <Badge tone="danger">Tidak tersedia · DEMO</Badge>
          </p>
          <p>
            <Badge tone="success">Valid · DEMO</Badge>
          </p>
          <Button disabled>Nonaktif</Button>
          <Button loading>Proses</Button>
          <Feedback title="Belum ada pilihan">
            Status kosong yang dapat dijelaskan.
          </Feedback>
          <Feedback tone="error" title="Contoh gagal">
            Periksa kembali pilihan.
          </Feedback>
        </Card>
        <Card>
          <h2>Panel terkontrol</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Button onClick={() => setDialog(true)} aria-haspopup="dialog">
              Buka dialog
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDrawer(true)}
              aria-haspopup="dialog"
            >
              Buka drawer
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMounted((value) => !value)}
            >
              Toggle mount modal
            </Button>
          </div>
        </Card>
      </div>
      {mounted ? (
        <Dialog
          open={dialog}
          onOpenChange={setDialog}
          title="Dialog contoh"
          description="Konfirmasi contoh DEMO tanpa penyimpanan."
          initialFocusRef={initial}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <FormField label="Fokus awal">
              {(props) => <Input {...props} ref={initial} />}
            </FormField>
            <Button onClick={() => setNested(true)}>
              Buka panel bertumpuk
            </Button>
            <Button onClick={() => setMounted(false)}>
              Unmount dari dalam
            </Button>
            <Button variant="secondary" onClick={() => setDialog(false)}>
              Selesai
            </Button>
          </div>
        </Dialog>
      ) : null}
      <Drawer
        open={drawer}
        onOpenChange={setDrawer}
        title="Drawer contoh"
        description="Panel DEMO pada sisi layar."
      >
        <p>Konten panjang tetap berada pada panel.</p>
        <div style={{ height: '120dvh' }} />
        <Button onClick={() => setDrawer(false)}>Selesai drawer</Button>
      </Drawer>
      <Dialog open={nested} onOpenChange={setNested} title="Dialog kedua">
        <p>Scroll lock tetap aktif ketika panel pertama masih terbuka.</p>
        <Button onClick={() => setNested(false)}>Kembali ke dialog</Button>
      </Dialog>
    </main>
  );
}
const root = document.getElementById('root');
if (!root) throw new Error('Fixture root missing');
createRoot(root).render(
  <StrictMode>
    <FoundationFixture />
  </StrictMode>,
);
