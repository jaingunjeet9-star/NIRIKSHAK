// API Client for NIRIKSHAK
// Complies with Guardrails 0.3 (API Contract), 0.4 (Record Lifecycle), and 0.5 (Error handling)

export interface ApiErrorDetail {
  code?: string;
  type?: string;
  message?: string;
  retryable?: boolean;
}

export interface ApiErrorResponse {
  success?: boolean;
  error?: string | ApiErrorDetail;
  message?: string;
  inspection?: any;
  details?: unknown;
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  inspection?: any;
  details?: unknown;
  retryable: boolean;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'api_error',
    inspection?: any,
    details?: unknown,
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.inspection = inspection;
    this.details = details;
    this.retryable = retryable;
  }
}

export async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (netErr: unknown) {
    console.error(`[API Network Connection Error] ${options.method || 'GET'} ${url}:`, netErr);
    throw new ApiClientError(
      'Unable to connect to NIRIKSHAK backend server. Please verify the server is running on http://localhost:3000.',
      0,
      'network_unavailable',
      undefined,
      netErr,
      true
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    let errorCode = 'server_error';
    let details: unknown = undefined;
    let errorInspection: any = undefined;
    let retryable = response.status >= 500 || response.status === 429;

    if (isJson) {
      try {
        const errorJson = (await response.json()) as ApiErrorResponse;
        if (typeof errorJson.error === 'object' && errorJson.error !== null) {
          errorMessage = errorJson.error.message || errorJson.message || errorMessage;
          errorCode = errorJson.error.code || errorCode;
          retryable = errorJson.error.retryable !== undefined ? errorJson.error.retryable : retryable;
        } else if (typeof errorJson.error === 'string') {
          errorCode = errorJson.error;
          errorMessage = errorJson.message || errorMessage;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
        details = errorJson.details;
        errorInspection = errorJson.inspection;
      } catch (parseErr) {
        console.warn('[API JSON Parse on Error] Failed:', parseErr);
      }
    } else {
      const rawText = await response.text();
      console.warn(`[API Non-JSON Response] HTTP ${response.status} from ${url}:`, rawText.slice(0, 300));
      if (response.status === 404) {
        errorMessage = 'Requested inspection API endpoint was not found (404).';
        retryable = false;
      } else if (response.status >= 500) {
        errorMessage = 'The backend server encountered an error processing your request (HTTP ' + response.status + ').';
      }
    }

    console.error(`[API Error] ${options.method || 'GET'} ${url} -> ${response.status}: ${errorMessage}`);
    throw new ApiClientError(errorMessage, response.status, errorCode, errorInspection, details, retryable);
  }

  if (!isJson) {
    console.warn(`[API Expected JSON] ${url} returned ${contentType}`);
    throw new ApiClientError(
      'Unexpected response format from backend service.',
      response.status,
      'invalid_content_type',
      undefined,
      undefined,
      false
    );
  }

  try {
    return (await response.json()) as T;
  } catch (jsonErr) {
    console.error(`[API JSON Parsing Failed] ${url}:`, jsonErr);
    throw new ApiClientError(
      'Unable to parse backend response.',
      response.status,
      'json_parse_failed',
      undefined,
      jsonErr,
      false
    );
  }
}

/**
 * Delete an inspection record.
 * Passes the caller's role and name as request headers so the backend can
 * enforce role-based access control independently of any UI-side gating.
 */
export async function deleteInspection(
  inspectionId: string,
  userRole: string,
  actorName: string
): Promise<{ success: boolean; deletedId: string; batchReference: string }> {
  return requestJson<{ success: boolean; deletedId: string; batchReference: string }>(
    `/api/inspections/${inspectionId}`,
    {
      method: 'DELETE',
      headers: {
        'x-user-role': userRole,
        'x-actor-name': actorName,
      },
    }
  );
}
