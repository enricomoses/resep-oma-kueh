'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type {
  AdminConfigOptionChoice,
  AdminConfigOptionGroup,
  AdminReferenceComponentVariant,
} from '@/types/admin-catalog';

interface AdminProductBundleOptionGroupsProps {
  errorPrefix: string;
  optionGroups: AdminConfigOptionGroup[];
  eligibleComponents: AdminReferenceComponentVariant[];
  fieldErrors: Record<string, string[]>;
  onChange: (nextGroups: AdminConfigOptionGroup[]) => void;
}

/** Subsection for configuring selectable option groups and flavor choices in a bundle. */
export function AdminProductBundleOptionGroups({
  errorPrefix,
  optionGroups,
  eligibleComponents,
  fieldErrors,
  onChange,
}: AdminProductBundleOptionGroupsProps) {
  function handleAddGroup() {
    const nextGroup: AdminConfigOptionGroup = {
      id: crypto.randomUUID(),
      name: `Grup Pilihan ${optionGroups.length + 1}`,
      minSelect: 1,
      maxSelect: 1,
      quantityPerSelection: 3,
      sortOrder: (optionGroups.length + 1) * 10,
      isRequired: true,
      choices: [],
    };
    onChange([...optionGroups, nextGroup]);
  }

  function updateGroupAt(
    gIdx: number,
    updater: (group: AdminConfigOptionGroup) => AdminConfigOptionGroup,
  ) {
    onChange(optionGroups.map((g, i) => (i === gIdx ? updater(g) : g)));
  }

  function updateChoiceAt(
    gIdx: number,
    cIdx: number,
    updater: (choice: AdminConfigOptionChoice) => AdminConfigOptionChoice,
  ) {
    updateGroupAt(gIdx, (group) => ({
      ...group,
      choices: group.choices.map((ch, i) => (i === cIdx ? updater(ch) : ch)),
    }));
  }

  function handleAddChoice(gIdx: number) {
    updateGroupAt(gIdx, (group) => {
      const nextChoice: AdminConfigOptionChoice = {
        id: crypto.randomUUID(),
        label: eligibleComponents[0]?.productName ?? 'Pilihan',
        componentVariantId: eligibleComponents[0]?.id ?? '',
        priceDeltaIdr: 0,
        isActive: true,
        sortOrder: (group.choices.length + 1) * 10,
      };
      return { ...group, choices: [...group.choices, nextChoice] };
    });
  }

  return (
    <div className="admin-editor-subsection">
      <div className="admin-section-header">
        <strong>Grup Pilihan Tambahan (Option Groups)</strong>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddGroup}
        >
          <Plus size={14} aria-hidden="true" />
          <span>Tambah Grup</span>
        </Button>
      </div>

      {fieldErrors[`${errorPrefix}.optionGroups`]?.[0] ? (
        <Feedback
          tone="error"
          title={fieldErrors[`${errorPrefix}.optionGroups`][0]}
          announce
        />
      ) : null}

      {optionGroups.map((group, gIdx) => (
        <Card key={group.id} tone="cream" className="admin-editor-subgroup">
          <div className="admin-editor-item-header">
            <FormField
              label={`Nama Grup #${gIdx + 1}`}
              error={
                fieldErrors[`${errorPrefix}.optionGroups.${gIdx}.name`]?.[0]
              }
            >
              {(props) => (
                <Input
                  {...props}
                  value={group.name}
                  onChange={(e) =>
                    updateGroupAt(gIdx, (g) => ({ ...g, name: e.target.value }))
                  }
                />
              )}
            </FormField>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange(optionGroups.filter((_, i) => i !== gIdx))
              }
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Hapus Grup</span>
            </Button>
          </div>

          {fieldErrors[`${errorPrefix}.optionGroups.${gIdx}.choices`]?.[0] ? (
            <p className="field-error" role="alert">
              {fieldErrors[`${errorPrefix}.optionGroups.${gIdx}.choices`][0]}
            </p>
          ) : null}

          <div className="admin-editor-stack">
            {group.choices.map((choice, cIdx) => (
              <div key={choice.id} className="admin-form-row-3">
                <FormField
                  label="Label Pilihan"
                  error={
                    fieldErrors[
                      `${errorPrefix}.optionGroups.${gIdx}.choices.${cIdx}.label`
                    ]?.[0]
                  }
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={choice.label}
                      onChange={(e) =>
                        updateChoiceAt(gIdx, cIdx, (ch) => ({
                          ...ch,
                          label: e.target.value,
                        }))
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label="SKU Komponen"
                  error={
                    fieldErrors[
                      `${errorPrefix}.optionGroups.${gIdx}.choices.${cIdx}.componentVariantId`
                    ]?.[0]
                  }
                >
                  {(props) => (
                    <Select
                      {...props}
                      value={choice.componentVariantId}
                      onChange={(e) => {
                        const comp = eligibleComponents.find(
                          (c) => c.id === e.target.value,
                        );
                        updateChoiceAt(gIdx, cIdx, (ch) => ({
                          ...ch,
                          componentVariantId: e.target.value,
                          label:
                            ch.label ||
                            (comp ? `${comp.productName} (3 pcs)` : ''),
                        }));
                      }}
                    >
                      <option value="">Pilih SKU komponen...</option>
                      {eligibleComponents.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.productName} · {cv.variantName} ({cv.sku})
                          {cv.isGlutenFreeVerified ? ' [GF]' : ''}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>

                <div className="admin-inline-actions">
                  <FormField label="Delta Harga (IDR)">
                    {(props) => (
                      <Input
                        {...props}
                        type="number"
                        min={0}
                        step={1}
                        value={String(choice.priceDeltaIdr)}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value, 10);
                          updateChoiceAt(gIdx, cIdx, (ch) => ({
                            ...ch,
                            priceDeltaIdr: Number.isFinite(val) ? val : 0,
                          }));
                        }}
                      />
                    )}
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus pilihan"
                    onClick={() =>
                      updateGroupAt(gIdx, (g) => ({
                        ...g,
                        choices: g.choices.filter((_, i) => i !== cIdx),
                      }))
                    }
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleAddChoice(gIdx)}
          >
            <Plus size={14} aria-hidden="true" />
            <span>Tambah Pilihan Rasa</span>
          </Button>
        </Card>
      ))}
    </div>
  );
}
