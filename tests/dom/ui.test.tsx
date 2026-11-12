import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Quantity } from '@/components/ui/quantity';

afterEach(cleanup);

it('connects the field label, helper and error without shared IDs across instances', () => {
  render(
    <>
      <FormField label="Nama" helper="Petunjuk" error="Periksa nama" required>
        {(props) => <Input {...props} />}
      </FormField>
      <FormField label="Lain">{(props) => <Input {...props} />}</FormField>
    </>,
  );
  const input = screen.getByLabelText(/Nama/);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toBeRequired();
  const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
  expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
    'Petunjuk',
    'Periksa nama',
  ]);
  expect(input.id).not.toBe(screen.getByLabelText('Lain').id);
});

it('loading prevents duplicate action and exposes its state without a toast', () => {
  const click = vi.fn();
  render(
    <Button loading onClick={click}>
      Simpan
    </Button>,
  );
  const button = screen.getByRole('button');
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'true');
  fireEvent.click(button);
  expect(click).not.toHaveBeenCalled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('quantity enforces integer bounds and emits a controlled next value', () => {
  const change = vi.fn();
  const view = render(
    <Quantity label="contoh" value={1} max={2} onChange={change} />,
  );
  expect(screen.getByRole('button', { name: 'Kurangi contoh' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Tambah contoh' }));
  expect(change).toHaveBeenCalledWith(2);
  view.rerender(
    <Quantity label="contoh" value={2} max={2} onChange={change} />,
  );
  expect(screen.getByRole('button', { name: 'Tambah contoh' })).toBeDisabled();
  view.unmount();
  expect(() =>
    render(<Quantity label="invalid" value={1.5} max={2} onChange={change} />),
  ).toThrow(RangeError);
});
