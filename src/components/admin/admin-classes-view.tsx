'use client';

import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
import {
  CLASS_PROGRAM_STATUSES,
  CLASS_SESSION_STATUSES,
} from '@/constants/classes.constant';
import { useUploadAdminProductMedia } from '@/hooks/use-admin-catalog';
import {
  useAdminClassPrograms,
  useAdminClassSessions,
  useArchiveAdminClassProgram,
  useArchiveAdminClassSession,
  useCreateAdminClassProgram,
  useCreateAdminClassSession,
  useUpdateAdminClassProgram,
  useUpdateAdminClassSession,
} from '@/hooks/use-admin-classes';
import { ApiClientError } from '@/lib/errors';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminClassProgramItem,
  AdminClassProgramsListData,
  AdminClassSessionItem,
  AdminClassSessionsListData,
  ClassProgramStatus,
  ClassSessionStatus,
  CreateAdminClassProgramInput,
  CreateAdminClassSessionInput,
  UpdateAdminClassProgramInput,
  UpdateAdminClassSessionInput,
} from '@/types/classes';
import { cn, formatIdr } from '@/utils';
import {
  formatJakartaDateTimeDisplay,
  fromJakartaDateTimeInputValue,
  toJakartaDateTimeInputValue,
} from '@/utils/admin-promotions';
import { formatClassAgeRange } from '@/utils/classes';

export interface AdminClassBranchOption {
  id: string;
  code: string;
  name: string;
  city: string;
  isActive: boolean;
}

interface AdminClassesViewProps {
  profile: AdminSessionProfile;
  initialPrograms: AdminClassProgramsListData;
  initialSessions: AdminClassSessionsListData;
  branches: AdminClassBranchOption[];
  className?: string;
}

interface ProgramFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  basePriceIdr: string;
  ageMin: string;
  ageMax: string;
  durationMinutes: string;
  includedItemsText: string;
  draftCoverPath: string | null;
  clearCover: boolean;
  coverAltText: string;
  coverPreviewUrl: string | null;
  coverIsApproved: boolean;
  needsOwnerReview: boolean;
  status: ClassProgramStatus;
}

interface SessionFormState {
  id: string | null;
  expectedUpdatedAt: string | null;
  programId: string;
  branchId: string;
  startsAtLocal: string;
  endsAtLocal: string;
  deadlineAtLocal: string;
  capacity: string;
  seatsLeft: string;
  priceOverrideIdr: string;
  status: ClassSessionStatus;
  isRegistrationOpen: boolean;
}

type ConfirmActionState =
  | { kind: 'archive_program'; item: AdminClassProgramItem }
  | { kind: 'cancel_session'; item: AdminClassSessionItem }
  | null;

const PROGRAM_STATUS_TONE: Record<
  ClassProgramStatus,
  'neutral' | 'success' | 'danger'
> = {
  draft: 'neutral',
  published: 'success',
  archived: 'danger',
};

const SESSION_STATUS_TONE: Record<
  ClassSessionStatus,
  'success' | 'accent' | 'danger' | 'neutral'
> = {
  scheduled: 'success',
  full: 'accent',
  cancelled: 'danger',
  completed: 'neutral',
};

function slugifyClassTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 100);
}

function parseOptionalIntInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function parseIncludedItemsText(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function createEmptyProgramForm(): ProgramFormState {
  return {
    id: null,
    expectedUpdatedAt: null,
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    basePriceIdr: '185000',
    ageMin: '4',
    ageMax: '12',
    durationMinutes: '90',
    includedItemsText: '',
    draftCoverPath: null,
    clearCover: false,
    coverAltText: '',
    coverPreviewUrl: null,
    coverIsApproved: false,
    needsOwnerReview: true,
    status: 'draft',
  };
}

function createProgramFormFromItem(
  item: AdminClassProgramItem,
): ProgramFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription ?? '',
    description: item.description ?? '',
    basePriceIdr: String(item.basePriceIdr),
    ageMin: item.ageMin === null ? '' : String(item.ageMin),
    ageMax: item.ageMax === null ? '' : String(item.ageMax),
    durationMinutes:
      item.durationMinutes === null ? '' : String(item.durationMinutes),
    includedItemsText: item.includedItems.join('\n'),
    draftCoverPath: null,
    clearCover: false,
    coverAltText: item.coverAltText ?? '',
    coverPreviewUrl: item.coverPreviewUrl,
    coverIsApproved: item.coverIsApproved,
    needsOwnerReview: item.needsOwnerReview,
    status: item.status,
  };
}

function createEmptySessionForm(
  defaultProgramId: string,
  defaultBranchId: string,
): SessionFormState {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrow.getTime() + 90 * 60 * 1000);
  const deadline = new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000);

  return {
    id: null,
    expectedUpdatedAt: null,
    programId: defaultProgramId,
    branchId: defaultBranchId,
    startsAtLocal: toJakartaDateTimeInputValue(tomorrow.toISOString()),
    endsAtLocal: toJakartaDateTimeInputValue(tomorrowEnd.toISOString()),
    deadlineAtLocal: toJakartaDateTimeInputValue(deadline.toISOString()),
    capacity: '12',
    seatsLeft: '',
    priceOverrideIdr: '',
    status: 'scheduled',
    isRegistrationOpen: false,
  };
}

function createSessionFormFromItem(
  item: AdminClassSessionItem,
): SessionFormState {
  return {
    id: item.id,
    expectedUpdatedAt: item.updatedAt,
    programId: item.programId,
    branchId: item.branchId,
    startsAtLocal: toJakartaDateTimeInputValue(item.startsAt),
    endsAtLocal: toJakartaDateTimeInputValue(item.endsAt),
    deadlineAtLocal: item.registrationDeadlineAt
      ? toJakartaDateTimeInputValue(item.registrationDeadlineAt)
      : '',
    capacity: String(item.capacity),
    seatsLeft: item.seatsLeft === null ? '' : String(item.seatsLeft),
    priceOverrideIdr:
      item.priceOverrideIdr === null ? '' : String(item.priceOverrideIdr),
    status: item.status,
    isRegistrationOpen: item.isRegistrationOpen,
  };
}

function extractMutationError(
  err: unknown,
  fallbackMessage: string,
): { message: string; fields: Record<string, string[]> } {
  if (err instanceof ApiClientError) {
    return {
      message: err.message || fallbackMessage,
      fields: err.fieldErrors ?? {},
    };
  }
  if (err instanceof Error && err.message) {
    return { message: err.message, fields: {} };
  }
  return { message: fallbackMessage, fields: {} };
}

export function AdminClassesView({
  profile,
  initialPrograms,
  initialSessions,
  branches,
  className,
}: AdminClassesViewProps) {
  const isOwner = profile.role === 'owner';
  const defaultBranchId =
    profile.role === 'branch_admin' && profile.branchId
      ? profile.branchId
      : (branches[0]?.id ?? '');

  const [filterBranchId, setFilterBranchId] = useState<string>(
    profile.role === 'branch_admin' && profile.branchId ? profile.branchId : '',
  );
  const [filterProgramId, setFilterProgramId] = useState<string>('');

  const programsQuery = useAdminClassPrograms(profile, initialPrograms);
  const sessionsQuery = useAdminClassSessions(
    profile,
    {
      branchId: filterBranchId || undefined,
      programId: filterProgramId || undefined,
    },
    initialSessions,
  );

  const createProgramMutation = useCreateAdminClassProgram();
  const updateProgramMutation = useUpdateAdminClassProgram();
  const archiveProgramMutation = useArchiveAdminClassProgram();
  const uploadMediaMutation = useUploadAdminProductMedia();

  const createSessionMutation = useCreateAdminClassSession();
  const updateSessionMutation = useUpdateAdminClassSession();
  const archiveSessionMutation = useArchiveAdminClassSession();

  const programs = useMemo(
    () => programsQuery.data?.items ?? [],
    [programsQuery.data?.items],
  );
  const sessions = sessionsQuery.data?.items ?? [];

  const selectableProgramsForSessions = useMemo(
    () =>
      isOwner
        ? programs.filter((item) => item.status !== 'archived')
        : programs.filter((item) => item.status === 'published'),
    [isOwner, programs],
  );

  const [programForm, setProgramForm] = useState<ProgramFormState>(
    createEmptyProgramForm,
  );
  const [isProgramEditorOpen, setIsProgramEditorOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [programFeedback, setProgramFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [programFieldErrors, setProgramFieldErrors] = useState<
    Record<string, string[]>
  >({});

  const [sessionForm, setSessionForm] = useState<SessionFormState>(() =>
    createEmptySessionForm(
      selectableProgramsForSessions[0]?.id ?? '',
      defaultBranchId,
    ),
  );
  const [isSessionEditorOpen, setIsSessionEditorOpen] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [sessionFieldErrors, setSessionFieldErrors] = useState<
    Record<string, string[]>
  >({});

  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);

  const isProgramBusy =
    createProgramMutation.isPending ||
    updateProgramMutation.isPending ||
    archiveProgramMutation.isPending ||
    uploadMediaMutation.isPending;

  const isSessionBusy =
    createSessionMutation.isPending ||
    updateSessionMutation.isPending ||
    archiveSessionMutation.isPending;

  function openNewProgramForm() {
    setProgramForm(createEmptyProgramForm());
    setSlugTouched(false);
    setProgramFieldErrors({});
    setProgramFeedback(null);
    setIsProgramEditorOpen(true);
  }

  function openEditProgramForm(item: AdminClassProgramItem) {
    setProgramForm(createProgramFormFromItem(item));
    setSlugTouched(true);
    setProgramFieldErrors({});
    setProgramFeedback(null);
    setIsProgramEditorOpen(true);
  }

  function openNewSessionForm() {
    setSessionForm(
      createEmptySessionForm(
        filterProgramId || selectableProgramsForSessions[0]?.id || '',
        profile.role === 'branch_admin' && profile.branchId
          ? profile.branchId
          : filterBranchId || defaultBranchId,
      ),
    );
    setSessionFieldErrors({});
    setSessionFeedback(null);
    setIsSessionEditorOpen(true);
  }

  function openEditSessionForm(item: AdminClassSessionItem) {
    setSessionForm(createSessionFormFromItem(item));
    setSessionFieldErrors({});
    setSessionFeedback(null);
    setIsSessionEditorOpen(true);
  }

  async function handleUploadProgramCover(file: File | null) {
    if (!file) return;
    setProgramFeedback(null);
    try {
      const response = await uploadMediaMutation.mutateAsync(file);
      setProgramForm((prev) => ({
        ...prev,
        draftCoverPath: response.data.storagePath,
        clearCover: false,
        coverPreviewUrl: response.data.previewUrl,
      }));
    } catch (err) {
      const parsed = extractMutationError(
        err,
        'Gagal mengunggah foto sampul program kelas.',
      );
      setProgramFeedback({ tone: 'error', message: parsed.message });
    }
  }

  async function handleSaveProgram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProgramFeedback(null);
    setProgramFieldErrors({});

    const basePrice = Number(programForm.basePriceIdr);
    const ageMin = parseOptionalIntInput(programForm.ageMin);
    const ageMax = parseOptionalIntInput(programForm.ageMax);
    const durationMinutes = parseOptionalIntInput(programForm.durationMinutes);

    const localErrors: Record<string, string[]> = {};
    if (!Number.isInteger(basePrice) || basePrice <= 0) {
      localErrors.basePriceIdr = [
        'Harga dasar harus berupa bilangan bulat > 0.',
      ];
    }
    if (Number.isNaN(ageMin)) {
      localErrors.ageMin = ['Usia minimum harus berupa angka bulat.'];
    }
    if (Number.isNaN(ageMax)) {
      localErrors.ageMax = ['Usia maksimum harus berupa angka bulat.'];
    }
    if (
      ageMin !== null &&
      ageMax !== null &&
      !Number.isNaN(ageMin) &&
      !Number.isNaN(ageMax) &&
      ageMin > ageMax
    ) {
      localErrors.ageMin = [
        ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_AGE_RANGE,
      ];
    }
    if (
      durationMinutes !== null &&
      (Number.isNaN(durationMinutes) || durationMinutes <= 0)
    ) {
      localErrors.durationMinutes = ['Durasi kelas harus > 0 menit.'];
    }

    if (Object.keys(localErrors).length > 0) {
      setProgramFieldErrors(localErrors);
      setProgramFeedback({
        tone: 'error',
        message: 'Periksa kembali kolom program kelas yang ditandai.',
      });
      return;
    }

    const includedItems = parseIncludedItemsText(programForm.includedItemsText);
    const shortDescription = programForm.shortDescription.trim() || null;
    const description = programForm.description.trim() || null;
    const coverAltText = programForm.coverAltText.trim() || null;

    try {
      if (!programForm.id) {
        const payload: CreateAdminClassProgramInput = {
          title: programForm.title.trim(),
          slug: programForm.slug.trim().toLowerCase(),
          shortDescription,
          description,
          basePriceIdr: basePrice,
          ageMin,
          ageMax,
          durationMinutes,
          includedItems,
          ...(programForm.draftCoverPath
            ? { draftCoverPath: programForm.draftCoverPath }
            : {}),
          coverAltText,
          coverIsApproved: programForm.coverIsApproved,
          needsOwnerReview: programForm.needsOwnerReview,
          status: programForm.status,
        };
        const result = await createProgramMutation.mutateAsync(payload);
        setProgramForm(createProgramFormFromItem(result.data.item));
        setProgramFeedback({
          tone: 'success',
          message: `Program "${result.data.item.title}" berhasil dibuat.`,
        });
      } else {
        const payload: UpdateAdminClassProgramInput = {
          title: programForm.title.trim(),
          shortDescription,
          description,
          basePriceIdr: basePrice,
          ageMin,
          ageMax,
          durationMinutes,
          includedItems,
          ...(programForm.draftCoverPath
            ? { draftCoverPath: programForm.draftCoverPath }
            : {}),
          ...(programForm.clearCover ? { clearCover: true } : {}),
          coverAltText,
          coverIsApproved: programForm.coverIsApproved,
          needsOwnerReview: programForm.needsOwnerReview,
          status: programForm.status,
          expectedUpdatedAt: programForm.expectedUpdatedAt ?? '',
        };
        const result = await updateProgramMutation.mutateAsync({
          id: programForm.id,
          payload,
        });
        setProgramForm(createProgramFormFromItem(result.data.item));
        setProgramFeedback({
          tone: 'success',
          message: `Program "${result.data.item.title}" berhasil diperbarui.`,
        });
      }
    } catch (err) {
      const parsed = extractMutationError(
        err,
        'Gagal menyimpan perubahan program kelas.',
      );
      setProgramFieldErrors(parsed.fields);
      setProgramFeedback({ tone: 'error', message: parsed.message });
    }
  }

  async function handleSaveSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSessionFeedback(null);
    setSessionFieldErrors({});

    const startsAtIso = fromJakartaDateTimeInputValue(
      sessionForm.startsAtLocal,
    );
    const endsAtIso = fromJakartaDateTimeInputValue(sessionForm.endsAtLocal);
    const deadlineAtIso = sessionForm.deadlineAtLocal.trim()
      ? fromJakartaDateTimeInputValue(sessionForm.deadlineAtLocal)
      : null;

    const capacity = Number(sessionForm.capacity);
    const seatsLeft = parseOptionalIntInput(sessionForm.seatsLeft);
    const priceOverrideIdr = isOwner
      ? parseOptionalIntInput(sessionForm.priceOverrideIdr)
      : null;

    const localErrors: Record<string, string[]> = {};
    if (!sessionForm.programId) {
      localErrors.programId = ['Pilih program kelas terlebih dahulu.'];
    }
    if (!sessionForm.branchId) {
      localErrors.branchId = ['Pilih cabang pelaksana sesi.'];
    }
    if (!startsAtIso) {
      localErrors.startsAt = ['Waktu mulai (WIB) wajib diisi lengkap.'];
    }
    if (!endsAtIso) {
      localErrors.endsAt = ['Waktu selesai (WIB) wajib diisi lengkap.'];
    }
    if (
      startsAtIso &&
      endsAtIso &&
      Date.parse(endsAtIso) <= Date.parse(startsAtIso)
    ) {
      localErrors.endsAt = [ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_INTERVAL];
    }
    if (sessionForm.deadlineAtLocal.trim() && !deadlineAtIso) {
      localErrors.registrationDeadlineAt = [
        'Format batas pendaftaran tidak valid.',
      ];
    }
    if (
      startsAtIso &&
      deadlineAtIso &&
      Date.parse(deadlineAtIso) > Date.parse(startsAtIso)
    ) {
      localErrors.registrationDeadlineAt = [
        ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_DEADLINE,
      ];
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      localErrors.capacity = [
        'Kapasitas peserta harus berupa bilangan bulat > 0.',
      ];
    }
    if (
      seatsLeft !== null &&
      (Number.isNaN(seatsLeft) || seatsLeft < 0 || seatsLeft > capacity)
    ) {
      localErrors.seatsLeft = [ADMIN_CATALOG_COPY.CLASSES.ERRORS.INVALID_SEATS];
    }
    if (
      isOwner &&
      priceOverrideIdr !== null &&
      (Number.isNaN(priceOverrideIdr) || priceOverrideIdr <= 0)
    ) {
      localErrors.priceOverrideIdr = [
        'Override harga harus berupa bilangan bulat > 0 atau dikosongkan.',
      ];
    }

    if (Object.keys(localErrors).length > 0 || !startsAtIso || !endsAtIso) {
      setSessionFieldErrors(localErrors);
      setSessionFeedback({
        tone: 'error',
        message: 'Periksa kembali kolom jadwal atau kapasitas sesi.',
      });
      return;
    }

    try {
      if (!sessionForm.id) {
        const payload: CreateAdminClassSessionInput = {
          programId: sessionForm.programId,
          branchId: sessionForm.branchId,
          startsAt: startsAtIso,
          endsAt: endsAtIso,
          registrationDeadlineAt: deadlineAtIso,
          capacity,
          seatsLeft,
          status: sessionForm.status,
          isRegistrationOpen: sessionForm.isRegistrationOpen,
          ...(isOwner && priceOverrideIdr !== null ? { priceOverrideIdr } : {}),
        };
        const result = await createSessionMutation.mutateAsync(payload);
        setSessionForm(createSessionFormFromItem(result.data.item));
        setSessionFeedback({
          tone: 'success',
          message: `Sesi ${result.data.item.programTitle} (${result.data.item.branchName}) berhasil ditambahkan.`,
        });
      } else {
        const payload: UpdateAdminClassSessionInput = {
          startsAt: startsAtIso,
          endsAt: endsAtIso,
          registrationDeadlineAt: deadlineAtIso,
          capacity,
          seatsLeft,
          status: sessionForm.status,
          isRegistrationOpen: sessionForm.isRegistrationOpen,
          ...(isOwner ? { priceOverrideIdr } : {}),
          expectedUpdatedAt: sessionForm.expectedUpdatedAt ?? '',
        };
        const result = await updateSessionMutation.mutateAsync({
          id: sessionForm.id,
          payload,
        });
        setSessionForm(createSessionFormFromItem(result.data.item));
        setSessionFeedback({
          tone: 'success',
          message: 'Perubahan sesi kelas berhasil disimpan.',
        });
      }
    } catch (err) {
      const parsed = extractMutationError(
        err,
        'Gagal menyimpan perubahan sesi kelas.',
      );
      setSessionFieldErrors(parsed.fields);
      setSessionFeedback({ tone: 'error', message: parsed.message });
    }
  }

  async function handleQuickMarkFull(item: AdminClassSessionItem) {
    setSessionFeedback(null);
    try {
      await updateSessionMutation.mutateAsync({
        id: item.id,
        payload: {
          status: 'full',
          isRegistrationOpen: false,
          expectedUpdatedAt: item.updatedAt,
        },
      });
      setSessionFeedback({
        tone: 'success',
        message: `Sesi ${item.programTitle} (${item.branchName}) ditandai penuh dan pendaftaran ditutup.`,
      });
    } catch (err) {
      const parsed = extractMutationError(
        err,
        'Gagal menandai sesi sebagai penuh.',
      );
      setSessionFeedback({ tone: 'error', message: parsed.message });
    }
  }

  async function handleConfirmDialogAction() {
    if (!confirmAction) return;

    if (confirmAction.kind === 'archive_program') {
      const target = confirmAction.item;
      try {
        await archiveProgramMutation.mutateAsync({
          id: target.id,
          expectedUpdatedAt: target.updatedAt,
        });
        setConfirmAction(null);
        setProgramFeedback({
          tone: 'success',
          message: `Program "${target.title}" telah diarsipkan dan pendaftaran sesinya ditutup.`,
        });
        if (programForm.id === target.id) {
          setIsProgramEditorOpen(false);
        }
      } catch (err) {
        const parsed = extractMutationError(err, 'Gagal mengarsipkan program.');
        setConfirmAction(null);
        setProgramFeedback({ tone: 'error', message: parsed.message });
      }
      return;
    }

    const target = confirmAction.item;
    try {
      await archiveSessionMutation.mutateAsync({
        id: target.id,
        expectedUpdatedAt: target.updatedAt,
      });
      setConfirmAction(null);
      setSessionFeedback({
        tone: 'success',
        message: `Sesi ${target.programTitle} (${target.branchName}) telah dibatalkan.`,
      });
      if (sessionForm.id === target.id) {
        setIsSessionEditorOpen(false);
      }
    } catch (err) {
      const parsed = extractMutationError(err, 'Gagal membatalkan sesi kelas.');
      setConfirmAction(null);
      setSessionFeedback({ tone: 'error', message: parsed.message });
    }
  }

  function handleRefreshAll() {
    void programsQuery.refetch();
    void sessionsQuery.refetch();
  }

  return (
    <div className={cn('admin-page-stack', className)}>
      <Card tone="surface" className="admin-section-card">
        <div className="admin-section-header">
          <div>
            <p className="admin-eyebrow">ROK Baking Class · R21</p>
            <h1 className="admin-section-title">
              {ADMIN_CATALOG_COPY.CLASSES.TITLE}
            </h1>
            <p className="admin-section-desc">
              {isOwner
                ? ADMIN_CATALOG_COPY.CLASSES.SUBTITLE_OWNER
                : ADMIN_CATALOG_COPY.CLASSES.SUBTITLE_STAFF}
            </p>
          </div>
          <div className="admin-inline-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRefreshAll}
              disabled={programsQuery.isFetching || sessionsQuery.isFetching}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.CLASSES.REFRESH}
            </Button>
            {isOwner ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openNewProgramForm}
              >
                <Plus size={16} aria-hidden="true" />
                {ADMIN_CATALOG_COPY.CLASSES.ADD_PROGRAM}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={openNewSessionForm}
              disabled={selectableProgramsForSessions.length === 0}
            >
              <Plus size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.CLASSES.ADD_SESSION}
            </Button>
          </div>
        </div>

        <div className="admin-classes-notices">
          <Feedback
            tone="info"
            title={ADMIN_CATALOG_COPY.CLASSES.PHOTO_CONSENT_RELEASE_GATE}
          />
          <Feedback
            tone="info"
            title={ADMIN_CATALOG_COPY.CLASSES.CAPACITY_MANUAL_NOTE}
          />
          {!isOwner ? (
            <Feedback
              tone="info"
              title={ADMIN_CATALOG_COPY.CLASSES.STAFF_PRICE_LOCK_NOTE}
            />
          ) : null}
        </div>
      </Card>

      <Card tone="surface" className="admin-section-card">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-panel-title">Program Kelas Baking</h2>
            <p className="admin-panel-desc">
              {isOwner
                ? 'Publikasi program memerlukan deskripsi lengkap, review Owner selesai, dan foto cover berstatus disetujui.'
                : 'Menampilkan program kelas berstatus terpublikasi dan disetujui Owner untuk penjadwalan sesi cabang Anda.'}
            </p>
          </div>
          {isOwner ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openNewProgramForm}
            >
              <Plus size={16} aria-hidden="true" />
              {ADMIN_CATALOG_COPY.CLASSES.ADD_PROGRAM}
            </Button>
          ) : null}
        </div>

        {programFeedback ? (
          <Feedback
            tone={programFeedback.tone}
            title={programFeedback.message}
            announce
          />
        ) : null}

        {isOwner && isProgramEditorOpen ? (
          <form
            className="admin-classes-form"
            onSubmit={handleSaveProgram}
            noValidate
          >
            <div className="admin-classes-form-header">
              <h3 className="admin-panel-title">
                {programForm.id ? 'Edit Program Kelas' : 'Tambah Program Kelas'}
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsProgramEditorOpen(false)}
              >
                Tutup Editor
              </Button>
            </div>

            <div className="admin-form-grid-2">
              <FormField
                id="class-program-title"
                label="Judul Program"
                error={programFieldErrors.title?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={programForm.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setProgramForm((prev) => ({
                        ...prev,
                        title,
                        slug:
                          !prev.id && !slugTouched
                            ? slugifyClassTitle(title)
                            : prev.slug,
                      }));
                    }}
                    placeholder="Contoh: Little Baker Chiffon Class"
                  />
                )}
              </FormField>

              <FormField
                id="class-program-slug"
                label="Slug Program (Permanen)"
                error={programFieldErrors.slug?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={programForm.slug}
                    disabled={Boolean(programForm.id)}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setProgramForm((prev) => ({
                        ...prev,
                        slug: event.target.value,
                      }));
                    }}
                    placeholder="little-baker-chiffon-class"
                  />
                )}
              </FormField>
            </div>

            <FormField
              id="class-program-short-desc"
              label="Ringkasan Singkat"
              error={programFieldErrors.shortDescription?.[0]}
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={programForm.shortDescription}
                  onChange={(event) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      shortDescription: event.target.value,
                    }))
                  }
                  placeholder="Kelas menghias dan memanggang kue kecil bersama pendampingan dapur OMA."
                />
              )}
            </FormField>

            <FormField
              id="class-program-description"
              label="Deskripsi Lengkap Program (Wajib untuk Publikasi)"
              error={programFieldErrors.description?.[0]}
            >
              {(fieldProps) => (
                <Textarea
                  {...fieldProps}
                  rows={3}
                  value={programForm.description}
                  onChange={(event) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              )}
            </FormField>

            <div className="admin-form-grid-4">
              <FormField
                id="class-program-price"
                label="Harga Dasar (IDR)"
                error={programFieldErrors.basePriceIdr?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={1000}
                    step={1000}
                    value={programForm.basePriceIdr}
                    onChange={(event) =>
                      setProgramForm((prev) => ({
                        ...prev,
                        basePriceIdr: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-program-age-min"
                label="Usia Min (Tahun)"
                error={programFieldErrors.ageMin?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={1}
                    max={99}
                    value={programForm.ageMin}
                    onChange={(event) =>
                      setProgramForm((prev) => ({
                        ...prev,
                        ageMin: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-program-age-max"
                label="Usia Maks (Tahun)"
                error={programFieldErrors.ageMax?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={1}
                    max={99}
                    value={programForm.ageMax}
                    onChange={(event) =>
                      setProgramForm((prev) => ({
                        ...prev,
                        ageMax: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-program-duration"
                label="Durasi (Menit)"
                error={programFieldErrors.durationMinutes?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={15}
                    max={720}
                    value={programForm.durationMinutes}
                    onChange={(event) =>
                      setProgramForm((prev) => ({
                        ...prev,
                        durationMinutes: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>
            </div>

            <FormField
              id="class-program-included"
              label="Fasilitas Termasuk (1 baris per poin)"
              error={programFieldErrors.includedItems?.[0]}
            >
              {(fieldProps) => (
                <Textarea
                  {...fieldProps}
                  rows={3}
                  value={programForm.includedItemsText}
                  onChange={(event) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      includedItemsText: event.target.value,
                    }))
                  }
                  placeholder={
                    'Bahan kue & peralatan dapur\nCelemek pinjaman\nHasil panggangan dibawa pulang'
                  }
                />
              )}
            </FormField>

            <div className="admin-classes-cover-box">
              <div className="admin-classes-cover-preview">
                {programForm.coverPreviewUrl && !programForm.clearCover ? (
                  <Image
                    src={programForm.coverPreviewUrl}
                    alt={
                      programForm.coverAltText ||
                      programForm.title ||
                      'Preview sampul kelas'
                    }
                    width={180}
                    height={120}
                    unoptimized
                    className="admin-classes-cover-thumb"
                  />
                ) : (
                  <div className="admin-classes-cover-empty">
                    Belum ada sampul dipilih
                  </div>
                )}
              </div>
              <div className="admin-classes-cover-fields">
                <label className="admin-upload-label">
                  <Upload size={16} aria-hidden="true" />
                  <span>
                    {uploadMediaMutation.isPending
                      ? 'Mengunggah ke draft...'
                      : 'Unggah Foto Sampul (JPG/PNG/WebP ≤ 5 MiB)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isProgramBusy}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleUploadProgramCover(file);
                      event.target.value = '';
                    }}
                  />
                </label>

                <FormField
                  id="class-program-cover-alt"
                  label="Teks Alt Foto Sampul (Wajib untuk Publikasi)"
                  error={programFieldErrors.coverAltText?.[0]}
                >
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      value={programForm.coverAltText}
                      onChange={(event) =>
                        setProgramForm((prev) => ({
                          ...prev,
                          coverAltText: event.target.value,
                        }))
                      }
                      placeholder="Suasana kelas menghias kue di dapur Resep Oma Kueh"
                    />
                  )}
                </FormField>

                <div className="admin-classes-checkbox-group">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={programForm.coverIsApproved}
                      onChange={(event) =>
                        setProgramForm((prev) => ({
                          ...prev,
                          coverIsApproved: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      Foto memiliki persetujuan publikasi peserta/wali
                      (cover_is_approved)
                    </span>
                  </label>
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={!programForm.needsOwnerReview}
                      onChange={(event) =>
                        setProgramForm((prev) => ({
                          ...prev,
                          needsOwnerReview: !event.target.checked,
                        }))
                      }
                    />
                    <span>
                      Review Owner selesai & siap rilis (needs_owner_review =
                      false)
                    </span>
                  </label>
                </div>

                {programForm.coverPreviewUrl || programForm.draftCoverPath ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setProgramForm((prev) => ({
                        ...prev,
                        draftCoverPath: null,
                        clearCover: true,
                        coverPreviewUrl: null,
                        coverIsApproved: false,
                      }))
                    }
                  >
                    Hapus Foto Sampul
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="admin-form-grid-2">
              <FormField
                id="class-program-status"
                label="Status Program"
                error={programFieldErrors.status?.[0]}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={programForm.status}
                    onChange={(event) =>
                      setProgramForm((prev) => ({
                        ...prev,
                        status: event.target.value as ClassProgramStatus,
                      }))
                    }
                  >
                    {CLASS_PROGRAM_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              <div className="admin-form-actions-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isProgramBusy}
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {programForm.id ? 'Simpan Perubahan Program' : 'Buat Program'}
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        {programs.length === 0 ? (
          <p className="admin-empty-copy">
            {ADMIN_CATALOG_COPY.CLASSES.EMPTY_PROGRAMS}
          </p>
        ) : (
          <div className="admin-classes-list">
            {programs.map((program) => (
              <div key={program.id} className="admin-classes-row-card">
                <div className="admin-classes-row-main">
                  <div className="admin-classes-row-badges">
                    <Badge tone={PROGRAM_STATUS_TONE[program.status]}>
                      {program.status}
                    </Badge>
                    <Badge
                      tone={program.needsOwnerReview ? 'accent' : 'success'}
                    >
                      {program.needsOwnerReview
                        ? 'Menunggu Review Owner'
                        : 'Sudah Direview'}
                    </Badge>
                    <Badge
                      tone={program.coverIsApproved ? 'success' : 'neutral'}
                    >
                      {program.coverIsApproved
                        ? 'Foto Disetujui'
                        : 'Foto Belum Disetujui'}
                    </Badge>
                  </div>
                  <h3 className="admin-row-title">
                    <GraduationCap size={16} aria-hidden="true" />
                    <span>{program.title}</span>
                  </h3>
                  <p className="admin-row-meta">
                    /{program.slug} · {formatIdr(program.basePriceIdr)} ·{' '}
                    {formatClassAgeRange(program.ageMin, program.ageMax)}
                    {program.durationMinutes
                      ? ` · ${program.durationMinutes} menit`
                      : ''}
                  </p>
                  {program.shortDescription ? (
                    <p className="admin-row-subcopy">
                      {program.shortDescription}
                    </p>
                  ) : null}
                </div>

                {isOwner ? (
                  <div className="admin-inline-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditProgramForm(program)}
                    >
                      <Edit3 size={15} aria-hidden="true" />
                      Edit
                    </Button>
                    {program.status !== 'archived' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({
                            kind: 'archive_program',
                            item: program,
                          })
                        }
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        Arsipkan
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card tone="surface" className="admin-section-card">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-panel-title">
              Jadwal & Kapasitas Sesi Cabang
            </h2>
            <p className="admin-panel-desc">
              Semua waktu diinput dalam zona WIB (Asia/Jakarta) dan disimpan
              sebagai UTC di database.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openNewSessionForm}
            disabled={selectableProgramsForSessions.length === 0}
          >
            <Plus size={16} aria-hidden="true" />
            {ADMIN_CATALOG_COPY.CLASSES.ADD_SESSION}
          </Button>
        </div>

        <div className="admin-form-grid-2">
          <FormField id="session-filter-branch" label="Filter Cabang">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={filterBranchId}
                disabled={profile.role === 'branch_admin'}
                onChange={(event) => setFilterBranchId(event.target.value)}
              >
                {isOwner ? <option value="">Semua Cabang</option> : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                    {!branch.isActive ? ' (Nonaktif)' : ''}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField id="session-filter-program" label="Filter Program Kelas">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={filterProgramId}
                onChange={(event) => setFilterProgramId(event.target.value)}
              >
                <option value="">Semua Program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>

        {sessionFeedback ? (
          <Feedback
            tone={sessionFeedback.tone}
            title={sessionFeedback.message}
            announce
          />
        ) : null}

        {isSessionEditorOpen ? (
          <form
            className="admin-classes-form"
            onSubmit={handleSaveSession}
            noValidate
          >
            <div className="admin-classes-form-header">
              <h3 className="admin-panel-title">
                {sessionForm.id
                  ? 'Edit Sesi Cabang'
                  : 'Tambah Sesi Cabang Baru'}
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsSessionEditorOpen(false)}
              >
                Tutup Form Sesi
              </Button>
            </div>

            <div className="admin-form-grid-2">
              <FormField
                id="class-session-program"
                label="Program Kelas"
                error={sessionFieldErrors.programId?.[0]}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={sessionForm.programId}
                    disabled={Boolean(sessionForm.id)}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        programId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Pilih program kelas</option>
                    {selectableProgramsForSessions.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.title} ({formatIdr(program.basePriceIdr)})
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              <FormField
                id="class-session-branch"
                label="Cabang Pelaksana"
                error={sessionFieldErrors.branchId?.[0]}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={sessionForm.branchId}
                    disabled={
                      Boolean(sessionForm.id) || profile.role === 'branch_admin'
                    }
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        branchId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Pilih cabang</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} ({branch.city})
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>

            <div className="admin-form-grid-3">
              <FormField
                id="class-session-starts"
                label="Waktu Mulai (WIB)"
                error={sessionFieldErrors.startsAt?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="datetime-local"
                    value={sessionForm.startsAtLocal}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        startsAtLocal: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-session-ends"
                label="Waktu Selesai (WIB)"
                error={sessionFieldErrors.endsAt?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="datetime-local"
                    value={sessionForm.endsAtLocal}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        endsAtLocal: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-session-deadline"
                label="Batas Pendaftaran (WIB, Opsional)"
                error={sessionFieldErrors.registrationDeadlineAt?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="datetime-local"
                    value={sessionForm.deadlineAtLocal}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        deadlineAtLocal: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>
            </div>

            <div className="admin-form-grid-4">
              <FormField
                id="class-session-capacity"
                label="Kapasitas Total"
                error={sessionFieldErrors.capacity?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={1}
                    value={sessionForm.capacity}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        capacity: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-session-seats-left"
                label="Sisa Kuota Manual (Kosong = Tidak Diketahui)"
                error={sessionFieldErrors.seatsLeft?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={0}
                    placeholder="Kosongkan jika belum pasti"
                    value={sessionForm.seatsLeft}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        seatsLeft: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-session-price-override"
                label={
                  isOwner
                    ? 'Override Harga Cabang (IDR, Opsional)'
                    : 'Override Harga (Terkunci · Owner Only)'
                }
                error={sessionFieldErrors.priceOverrideIdr?.[0]}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={1000}
                    step={1000}
                    disabled={!isOwner}
                    placeholder={
                      isOwner
                        ? 'Ikuti harga dasar program'
                        : 'Mengikuti harga dasar / aturan Owner'
                    }
                    value={sessionForm.priceOverrideIdr}
                    onChange={(event) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        priceOverrideIdr: event.target.value,
                      }))
                    }
                  />
                )}
              </FormField>

              <FormField
                id="class-session-status"
                label="Status Sesi"
                error={sessionFieldErrors.status?.[0]}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={sessionForm.status}
                    onChange={(event) => {
                      const nextStatus = event.target
                        .value as ClassSessionStatus;
                      setSessionForm((prev) => ({
                        ...prev,
                        status: nextStatus,
                        isRegistrationOpen:
                          nextStatus === 'scheduled'
                            ? prev.isRegistrationOpen
                            : false,
                      }));
                    }}
                  >
                    {CLASS_SESSION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>

            <div className="admin-form-grid-2">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={sessionForm.isRegistrationOpen}
                  disabled={sessionForm.status !== 'scheduled'}
                  onChange={(event) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      isRegistrationOpen: event.target.checked,
                    }))
                  }
                />
                <span>
                  Buka pendaftaran WhatsApp publik (is_registration_open)
                </span>
              </label>

              <div className="admin-form-actions-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSessionBusy}
                >
                  <CalendarClock size={16} aria-hidden="true" />
                  {sessionForm.id
                    ? 'Simpan Perubahan Sesi'
                    : 'Buat Sesi Cabang'}
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        {sessions.length === 0 ? (
          <p className="admin-empty-copy">
            {ADMIN_CATALOG_COPY.CLASSES.EMPTY_SESSIONS}
          </p>
        ) : (
          <div className="admin-classes-list">
            {sessions.map((session) => (
              <div key={session.id} className="admin-classes-row-card">
                <div className="admin-classes-row-main">
                  <div className="admin-classes-row-badges">
                    <Badge tone={SESSION_STATUS_TONE[session.status]}>
                      {session.status}
                    </Badge>
                    <Badge
                      tone={session.isRegistrationOpen ? 'success' : 'neutral'}
                    >
                      {session.isRegistrationOpen
                        ? 'Pendaftaran Dibuka'
                        : 'Pendaftaran Ditutup'}
                    </Badge>
                    <Badge tone={session.branchIsActive ? 'neutral' : 'danger'}>
                      {session.branchName}
                    </Badge>
                  </div>
                  <h3 className="admin-row-title">{session.programTitle}</h3>
                  <p className="admin-row-meta">
                    {formatJakartaDateTimeDisplay(session.startsAt)} —{' '}
                    {formatJakartaDateTimeDisplay(session.endsAt)}
                    {session.registrationDeadlineAt
                      ? ` · Batas daftar: ${formatJakartaDateTimeDisplay(session.registrationDeadlineAt)}`
                      : ''}
                  </p>
                  <p className="admin-row-subcopy">
                    Tarif efektif: {formatIdr(session.effectivePriceIdr)}
                    {session.priceOverrideIdr !== null
                      ? ` (override cabang; dasar ${formatIdr(session.programBasePriceIdr)})`
                      : ' (mengikuti harga dasar)'}{' '}
                    · Kapasitas: {session.capacity} ·{' '}
                    {session.seatsLeft === null
                      ? 'Sisa kuota belum dirinci (estimasi manual)'
                      : `${session.seatsLeft} kursi tersisa`}
                  </p>
                </div>

                <div className="admin-inline-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditSessionForm(session)}
                    disabled={isSessionBusy}
                  >
                    <Edit3 size={15} aria-hidden="true" />
                    Edit
                  </Button>
                  {session.status === 'scheduled' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleQuickMarkFull(session)}
                      disabled={isSessionBusy}
                    >
                      Tandai Penuh
                    </Button>
                  ) : null}
                  {session.status !== 'cancelled' &&
                  session.status !== 'completed' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setConfirmAction({
                          kind: 'cancel_session',
                          item: session,
                        })
                      }
                      disabled={isSessionBusy}
                    >
                      <Ban size={15} aria-hidden="true" />
                      Batalkan Sesi
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={
          confirmAction?.kind === 'archive_program'
            ? ADMIN_CATALOG_COPY.CLASSES.ARCHIVE_PROGRAM_TITLE
            : ADMIN_CATALOG_COPY.CLASSES.CANCEL_SESSION_TITLE
        }
        description={
          confirmAction?.kind === 'archive_program'
            ? ADMIN_CATALOG_COPY.CLASSES.ARCHIVE_PROGRAM_DESC
            : ADMIN_CATALOG_COPY.CLASSES.CANCEL_SESSION_DESC
        }
      >
        <div className="admin-inline-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmAction(null)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isProgramBusy || isSessionBusy}
            onClick={() => void handleConfirmDialogAction()}
          >
            {confirmAction?.kind === 'archive_program'
              ? ADMIN_CATALOG_COPY.CLASSES.ARCHIVE_PROGRAM_SUBMIT
              : ADMIN_CATALOG_COPY.CLASSES.CANCEL_SESSION_SUBMIT}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
