import "server-only";

const CHARIOW_BASE_URL = "https://api.chariow.com/v1";

export type ChariowLicenseStatus =
  | "pending_activation"
  | "active"
  | "expired"
  | "revoked";

export type ChariowLicense = {
  key: string;
  masked_key?: string;
  status: ChariowLicenseStatus;
  is_active?: boolean;
  is_expired?: boolean;
  expires_at: string | null;
  customer?: { id?: string; email?: string };
  product?: { id?: string; name?: string };
  activations?: { count?: number; max?: number; remaining?: number };
  [key: string]: unknown;
};

export class ChariowError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ChariowError";
    this.status = status;
    this.body = body;
  }
}

function getApiKey(): string {
  const key = process.env.CHARIOW_API_KEY;
  if (!key) throw new Error("Missing CHARIOW_API_KEY");
  return key;
}

async function chariowRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CHARIOW_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && "message" in body
        ? String((body as Record<string, unknown>).message)
        : null) ?? `Chariow API error (${response.status})`;
    throw new ChariowError(message, response.status, body);
  }

  const data =
    body && typeof body === "object" && "data" in body
      ? (body as Record<string, unknown>).data
      : body;
  return data as T;
}

// Single entry point to the Chariow API (AGENTS.md §4).
export async function getLicense(licenseKey: string): Promise<ChariowLicense> {
  return chariowRequest<ChariowLicense>(
    `/licenses/${encodeURIComponent(licenseKey)}`,
  );
}

// Consumes one activation slot on the license (Chariow's device-activation
// model — our "device" is the student account, deviceIdentifier = student.id).
// This is what moves a fresh purchase from pending_activation to active.
export async function activateLicense(
  licenseKey: string,
  deviceIdentifier: string,
): Promise<ChariowLicense> {
  return chariowRequest<ChariowLicense>(
    `/licenses/${encodeURIComponent(licenseKey)}/activate`,
    { method: "POST", body: JSON.stringify({ device_identifier: deviceIdentifier }) },
  );
}

export type ChariowCheckoutRequest = {
  product_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: { number: string; country_code: string };
  custom_metadata?: Record<string, string>;
  redirect_url?: string;
};

export type ChariowCheckoutResponse = {
  step: "payment" | "completed" | "already_purchased";
  message?: string;
  purchase?: { id: string };
  payment?: { checkout_url: string; transaction_id?: string };
};

export async function createCheckoutSession(
  params: ChariowCheckoutRequest,
): Promise<ChariowCheckoutResponse> {
  return chariowRequest<ChariowCheckoutResponse>("/checkout", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
