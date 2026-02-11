import { ORPCError, ValidationError } from "@orpc/server";
import { ZodError, prettifyError, type core } from "zod";

import {
  ORPC_ERROR_KINDS,
  type ORPCErrorKind,
  type ORPCSafeErrorData,
} from "./error-shared";

import {
  FILE_TOO_LARGE_PATTERN,
  INVALID_FILE_FORMAT_PATTERN,
} from "./error-patterns";

const MAX_LOG_DEPTH = 6;
const SECRET_KEY_PATTERN =
  /(api[_-]?key|authorization|cookie|password|secret|token|set-cookie)/i;
const BEARER_TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/giu;
const OPENAI_KEY_PATTERN = /sk-[A-Za-z0-9_-]{12,}/giu;

const SAFE_ORPC_CODES = new Set([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "UNPROCESSABLE_CONTENT",
  "TOO_MANY_REQUESTS",
]);

const PROVIDER_QUOTA_PATTERN =
  /(insufficient[_ ]quota|exceeded your current quota|billing|rate limit)/iu;
const TIMEOUT_PATTERN =
  /(timeout|timed out|request timed out|gateway timeout|etimedout|aborterror)/iu;
const NETWORK_PATTERN =
  /(network|fetch failed|econnreset|econnrefused|enotfound|socket hang up|tls)/iu;

const ORPC_KIND_TO_CODE: Record<
  ORPCErrorKind,
  { code: string; status: number; message: string }
> = {
  FILE_TOO_LARGE: {
    code: "PAYLOAD_TOO_LARGE",
    status: 413,
    message: "File is too large.",
  },
  INVALID_FILE_FORMAT: {
    code: "UNSUPPORTED_MEDIA_TYPE",
    status: 415,
    message: "Unsupported file format.",
  },
  NETWORK: {
    code: "SERVICE_UNAVAILABLE",
    status: 503,
    message: "Service is temporarily unavailable.",
  },
  PROVIDER_QUOTA: {
    code: "TOO_MANY_REQUESTS",
    status: 429,
    message: "AI service is currently unavailable.",
  },
  TIMEOUT: {
    code: "GATEWAY_TIMEOUT",
    status: 504,
    message: "The request timed out. Please try again.",
  },
  UNEXPECTED: {
    code: "INTERNAL_SERVER_ERROR",
    status: 500,
    message: "Something went wrong. Please try again.",
  },
  VALIDATION: {
    code: "UNPROCESSABLE_CONTENT",
    status: 422,
    message: "Please review your input.",
  },
};

export function getORPCErrorMetadataForKind(kind: ORPCErrorKind): {
  code: string;
  status: number;
  message: string;
} {
  return ORPC_KIND_TO_CODE[kind];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function redactString(value: string): string {
  return value
    .replace(BEARER_TOKEN_PATTERN, "Bearer [REDACTED]")
    .replace(OPENAI_KEY_PATTERN, "sk-[REDACTED]");
}

function sanitizeForLog(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (depth > MAX_LOG_DEPTH) {
    return "[MAX_DEPTH]";
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
      cause: sanitizeForLog(value.cause, depth + 1, seen),
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForLog(entry, depth + 1, seen));
  }

  if (!isRecord(value)) {
    return String(value);
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }

  seen.add(value);

  const output: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      output[key] = "[REDACTED]";
      continue;
    }

    output[key] = sanitizeForLog(nestedValue, depth + 1, seen);
  }

  return output;
}

function extractCorrelationId(headers?: Headers): string | undefined {
  if (!headers) {
    return undefined;
  }

  const requestId = headers.get("x-request-id");
  if (requestId) {
    return requestId;
  }

  const correlationId = headers.get("x-correlation-id");
  if (correlationId) {
    return correlationId;
  }

  const traceParent = headers.get("traceparent");
  if (!traceParent) {
    return undefined;
  }

  const parts = traceParent.split("-");
  return parts[1];
}

function collectErrorCandidates(error: unknown): string[] {
  const candidates: string[] = [];
  const queue: unknown[] = [error];
  let index = 0;

  while (index < queue.length && index < MAX_LOG_DEPTH) {
    const current = queue[index];
    index += 1;

    if (current instanceof Error) {
      candidates.push(`${current.name}:${current.message}`);
      if (current.cause !== undefined) {
        queue.push(current.cause);
      }
      continue;
    }

    if (isRecord(current)) {
      const message = current.message;
      if (typeof message === "string") {
        candidates.push(message);
      }

      const code = current.code;
      if (typeof code === "string") {
        candidates.push(code);
      }

      if (Object.hasOwn(current, "cause")) {
        queue.push(current.cause);
      }
    }
  }

  return candidates;
}

export function classifyORPCErrorKind(error: unknown): ORPCErrorKind {
  if (error instanceof ORPCError) {
    // Prefer explicit oRPC codes when available.
    switch (error.code) {
      case "PAYLOAD_TOO_LARGE":
        return ORPC_ERROR_KINDS.FILE_TOO_LARGE;
      case "UNSUPPORTED_MEDIA_TYPE":
        return ORPC_ERROR_KINDS.INVALID_FILE_FORMAT;
      case "UNPROCESSABLE_CONTENT":
      case "BAD_REQUEST":
        // BAD_REQUEST may contain safe validation guidance.
        if (error.cause instanceof ValidationError) {
          return ORPC_ERROR_KINDS.VALIDATION;
        }
        return ORPC_ERROR_KINDS.VALIDATION;
      case "TOO_MANY_REQUESTS":
        return ORPC_ERROR_KINDS.PROVIDER_QUOTA;
      case "TIMEOUT":
      case "GATEWAY_TIMEOUT":
        return ORPC_ERROR_KINDS.TIMEOUT;
      case "BAD_GATEWAY":
      case "SERVICE_UNAVAILABLE":
        return ORPC_ERROR_KINDS.NETWORK;
      default:
        break;
    }
  }

  if (error instanceof ValidationError) {
    return ORPC_ERROR_KINDS.VALIDATION;
  }

  const candidates = collectErrorCandidates(error).join(" ");

  if (FILE_TOO_LARGE_PATTERN.test(candidates)) {
    return ORPC_ERROR_KINDS.FILE_TOO_LARGE;
  }

  if (INVALID_FILE_FORMAT_PATTERN.test(candidates)) {
    return ORPC_ERROR_KINDS.INVALID_FILE_FORMAT;
  }

  if (PROVIDER_QUOTA_PATTERN.test(candidates)) {
    return ORPC_ERROR_KINDS.PROVIDER_QUOTA;
  }

  if (TIMEOUT_PATTERN.test(candidates)) {
    return ORPC_ERROR_KINDS.TIMEOUT;
  }

  if (NETWORK_PATTERN.test(candidates)) {
    return ORPC_ERROR_KINDS.NETWORK;
  }

  return ORPC_ERROR_KINDS.UNEXPECTED;
}

export function getUserSafeMessageForORPCKind(kind: ORPCErrorKind): string {
  return getORPCErrorMetadataForKind(kind).message;
}

export function logInternalORPCError(input: {
  error: unknown;
  procedure: string;
  kind: ORPCErrorKind;
  headers?: Headers;
  mappedCode: string;
  mappedStatus: number;
}): void {
  const correlationId = extractCorrelationId(input.headers);

  const payload = JSON.stringify({
    event: "orpc_error",
    procedure: input.procedure,
    correlationId,
    errorType: input.kind,
    mappedCode: input.mappedCode,
    mappedStatus: input.mappedStatus,
    error: sanitizeForLog(input.error),
  });

  process.stderr.write(
    `${new Date().toISOString()} ERROR oRPC procedure failed ${payload}\n`
  );
}

function isSafeORPCError(error: ORPCError<string, unknown>): boolean {
  if (!SAFE_ORPC_CODES.has(error.code)) {
    return false;
  }

  return !PROVIDER_QUOTA_PATTERN.test(error.message);
}

export function toUserSafeORPCError(
  error: unknown,
  options: { procedure: string; headers?: Headers }
): ORPCError<string, ORPCSafeErrorData> {
  if (error instanceof ORPCError && isSafeORPCError(error)) {
    const nextData: ORPCSafeErrorData = {
      ...(typeof error.data === "object" && error.data !== null
        ? (error.data as Record<string, unknown>)
        : {}),
      // Ensure required fields exist for client-side mapping.
      kind: classifyORPCErrorKind(error),
      procedure: options.procedure,
    } as ORPCSafeErrorData;

    return new ORPCError(error.code, {
      status: error.status,
      message: error.message,
      data: nextData,
      headers: error.headers,
      cause: error.cause,
    });
  }

  if (
    error instanceof ORPCError &&
    error.code === "BAD_REQUEST" &&
    error.cause instanceof ValidationError
  ) {
    const zodError = new ZodError(error.cause.issues as core.$ZodIssue[]);

    return new ORPCError("UNPROCESSABLE_CONTENT", {
      status: 422,
      message: prettifyError(zodError),
      data: {
        kind: ORPC_ERROR_KINDS.VALIDATION,
        procedure: options.procedure,
      },
      cause: error.cause,
    });
  }

  const kind = classifyORPCErrorKind(error);
  const mapped = getORPCErrorMetadataForKind(kind);

  logInternalORPCError({
    error,
    procedure: options.procedure,
    kind,
    headers: options.headers,
    mappedCode: mapped.code,
    mappedStatus: mapped.status,
  });

  return new ORPCError(mapped.code, {
    status: mapped.status,
    message: mapped.message,
    data: {
      kind,
      procedure: options.procedure,
    },
    cause: error instanceof Error ? error : undefined,
  });
}
