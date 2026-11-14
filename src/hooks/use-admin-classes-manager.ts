'use client';

import { type FormEvent, useMemo, useState } from 'react';

import { ADMIN_CATALOG_COPY } from '@/constants/admin-catalog.constant';
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
import { extractAdminMutationError } from '@/lib/errors';
import type { AdminSessionProfile } from '@/types/auth';
import type {
  AdminClassBranchOption,
  AdminClassProgramItem,
  AdminClassProgramsListData,
  AdminClassSessionItem,
  AdminClassSessionsListData,
  ConfirmActionState,
  CreateAdminClassProgramInput,
  CreateAdminClassSessionInput,
  ProgramFormState,
  SessionFormState,
  UpdateAdminClassProgramInput,
  UpdateAdminClassSessionInput,
} from '@/types/classes';
import {
  createEmptyProgramForm,
  createEmptySessionForm,
  createProgramFormFromItem,
  createSessionFormFromItem,
  parseIncludedItemsText,
  parseOptionalIntInput,
} from '@/utils/admin-classes';
import { fromJakartaDateTimeInputValue } from '@/utils/admin-promotions';

interface UseAdminClassesManagerParams {
  profile: AdminSessionProfile;
  initialPrograms: AdminClassProgramsListData;
  initialSessions: AdminClassSessionsListData;
  branches: AdminClassBranchOption[];
}

/**
 * Coordinates state, filtering, editors, and mutations for the admin classes dashboard.
 */
export function useAdminClassesManager({
  profile,
  initialPrograms,
  initialSessions,
  branches,
}: UseAdminClassesManagerParams) {
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
      const parsed = extractAdminMutationError(
        err,
        'Gagal mengunggah foto sampul program kelas.',
      );
      setProgramFeedback({ tone: 'error', message: parsed.message });
    }
  }

  async function handleSaveProgram(event: FormEvent<HTMLFormElement>) {
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
      const parsed = extractAdminMutationError(
        err,
        'Gagal menyimpan perubahan program kelas.',
      );
      setProgramFieldErrors(parsed.fields);
      setProgramFeedback({ tone: 'error', message: parsed.message });
    }
  }

  async function handleSaveSession(event: FormEvent<HTMLFormElement>) {
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
      const parsed = extractAdminMutationError(
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
      const parsed = extractAdminMutationError(
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
        const parsed = extractAdminMutationError(
          err,
          'Gagal mengarsipkan program.',
        );
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
      const parsed = extractAdminMutationError(
        err,
        'Gagal membatalkan sesi kelas.',
      );
      setConfirmAction(null);
      setSessionFeedback({ tone: 'error', message: parsed.message });
    }
  }

  function handleRefreshAll() {
    void programsQuery.refetch();
    void sessionsQuery.refetch();
  }

  return {
    isOwner,
    isBranchLocked: profile.role === 'branch_admin',
    isFetchingAny: programsQuery.isFetching || sessionsQuery.isFetching,
    programs,
    sessions,
    selectableProgramsForSessions,
    filterBranchId,
    setFilterBranchId,
    filterProgramId,
    setFilterProgramId,
    programForm,
    setProgramForm,
    isProgramEditorOpen,
    setIsProgramEditorOpen,
    slugTouched,
    setSlugTouched,
    programFeedback,
    programFieldErrors,
    isProgramBusy,
    isUploadingMedia: uploadMediaMutation.isPending,
    sessionForm,
    setSessionForm,
    isSessionEditorOpen,
    setIsSessionEditorOpen,
    sessionFeedback,
    sessionFieldErrors,
    isSessionBusy,
    confirmAction,
    setConfirmAction,
    openNewProgramForm,
    openEditProgramForm,
    openNewSessionForm,
    openEditSessionForm,
    handleUploadProgramCover: (file: File | null) =>
      void handleUploadProgramCover(file),
    handleSaveProgram: (event: FormEvent<HTMLFormElement>) =>
      void handleSaveProgram(event),
    handleSaveSession: (event: FormEvent<HTMLFormElement>) =>
      void handleSaveSession(event),
    handleQuickMarkFull: (item: AdminClassSessionItem) =>
      void handleQuickMarkFull(item),
    handleConfirmDialogAction: () => void handleConfirmDialogAction(),
    handleRefreshAll,
  };
}
