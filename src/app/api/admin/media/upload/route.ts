import {
  ADMIN_CATALOG_COPY,
  ADMIN_MEDIA_LIMITS,
} from '@/constants/admin-catalog.constant';
import { AdminCatalogValidationError } from '@/features/admin-catalog/errors.server';
import { uploadDraftProductMedia } from '@/features/admin-catalog/media.server';
import { requireApiAdmin } from '@/features/auth/admin-guard.server';
import { assertSameOriginRequest } from '@/features/auth/csrf.server';
import {
  AuthInvalidRequestError,
  AuthRequestTooLargeError,
} from '@/features/auth/errors.server';
import {
  createAuthJsonError,
  createAuthJsonSuccess,
  createCookieCarrierResponse,
} from '@/features/auth/http.server';
import { adminMediaUploadResponseSchema } from '@/validations/admin-catalog.schema';

const MAX_MULTIPART_FRAMING_OVERHEAD = 131_072;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const carrier = createCookieCarrierResponse();

  try {
    assertSameOriginRequest(request);
    const profile = await requireApiAdmin({
      roles: ['owner'],
      response: carrier,
    });

    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader) {
      const declaredBytes = Number.parseInt(contentLengthHeader, 10);
      if (
        Number.isFinite(declaredBytes) &&
        declaredBytes >
          ADMIN_MEDIA_LIMITS.MAX_FILE_BYTES + MAX_MULTIPART_FRAMING_OVERHEAD
      ) {
        throw new AuthRequestTooLargeError(
          ADMIN_CATALOG_COPY.MEDIA.ERRORS.FILE_TOO_LARGE,
        );
      }
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new AuthInvalidRequestError(
        'Permintaan upload harus berupa multipart/form-data dengan field file.',
      );
    }

    const uploaded = formData.get('file');
    if (!(uploaded instanceof File)) {
      throw new AdminCatalogValidationError(
        'Pilih satu berkas foto untuk diunggah.',
        { file: ['Pilih satu berkas foto untuk diunggah.'] },
      );
    }

    if (uploaded.size > ADMIN_MEDIA_LIMITS.MAX_FILE_BYTES) {
      throw new AuthRequestTooLargeError(
        ADMIN_CATALOG_COPY.MEDIA.ERRORS.FILE_TOO_LARGE,
      );
    }

    const rawBytes = new Uint8Array(await uploaded.arrayBuffer());
    const result = await uploadDraftProductMedia(
      profile,
      {
        bytes: rawBytes,
        mimeType: uploaded.type,
        originalFileName: uploaded.name,
      },
      {
        response: carrier,
        signal: request.signal,
      },
    );

    return createAuthJsonSuccess(
      result,
      adminMediaUploadResponseSchema,
      requestId,
      carrier,
      201,
    );
  } catch (err) {
    return createAuthJsonError(err, requestId, carrier);
  }
}
