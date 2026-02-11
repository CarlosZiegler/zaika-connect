import { isDefinedError } from "@orpc/client";

import {
  ORPC_ERROR_KINDS,
  ORPC_ERROR_MESSAGE_KEYS,
  ORPC_ERROR_MESSAGE_KEY_BY_KIND,
  type ORPCErrorKind,
  type ORPCErrorMessageKey,
} from "./error-shared";

const FILE_TOO_LARGE_PATTERN =
  /(file size exceeds|payload too large|max(?:imum)? allowed size|too large)/iu;
const INVALID_FILE_FORMAT_PATTERN =
  /(invalid file format|unsupported media type|file type .* is not allowed|mime type)/iu;

type ORPCErrorLike = {
  code: string;
  data?: unknown;
  message: string;
};

function getKindFromData(data: unknown): ORPCErrorKind | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  const kindValue = data as { kind?: unknown };
  const maybeKind = kindValue.kind;

  if (typeof maybeKind !== "string") {
    return undefined;
  }

  if (
    maybeKind === ORPC_ERROR_KINDS.FILE_TOO_LARGE ||
    maybeKind === ORPC_ERROR_KINDS.INVALID_FILE_FORMAT ||
    maybeKind === ORPC_ERROR_KINDS.NETWORK ||
    maybeKind === ORPC_ERROR_KINDS.PROVIDER_QUOTA ||
    maybeKind === ORPC_ERROR_KINDS.TIMEOUT ||
    maybeKind === ORPC_ERROR_KINDS.UNEXPECTED ||
    maybeKind === ORPC_ERROR_KINDS.VALIDATION
  ) {
    return maybeKind;
  }

  return undefined;
}

function isORPCErrorLike(error: unknown): error is ORPCErrorLike {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybe = error as Partial<ORPCErrorLike>;

  return typeof maybe.code === "string" && typeof maybe.message === "string";
}

export function getORPCErrorMessageKey(error: unknown): ORPCErrorMessageKey {
  if (!isDefinedError(error) && !isORPCErrorLike(error)) {
    return ORPC_ERROR_MESSAGE_KEYS.GENERIC;
  }

  const kind = getKindFromData(error.data);
  if (kind) {
    return ORPC_ERROR_MESSAGE_KEY_BY_KIND[kind];
  }

  if (FILE_TOO_LARGE_PATTERN.test(error.message)) {
    return ORPC_ERROR_MESSAGE_KEYS.FILE_TOO_LARGE;
  }

  if (INVALID_FILE_FORMAT_PATTERN.test(error.message)) {
    return ORPC_ERROR_MESSAGE_KEYS.INVALID_FILE_FORMAT;
  }

  switch (error.code) {
    case "PAYLOAD_TOO_LARGE":
      return ORPC_ERROR_MESSAGE_KEYS.FILE_TOO_LARGE;
    case "UNSUPPORTED_MEDIA_TYPE":
      return ORPC_ERROR_MESSAGE_KEYS.INVALID_FILE_FORMAT;
    case "UNPROCESSABLE_CONTENT":
    case "BAD_REQUEST":
      return ORPC_ERROR_MESSAGE_KEYS.VALIDATION;
    case "TOO_MANY_REQUESTS":
      return ORPC_ERROR_MESSAGE_KEYS.AI_UNAVAILABLE;
    case "TIMEOUT":
    case "GATEWAY_TIMEOUT":
      return ORPC_ERROR_MESSAGE_KEYS.TIMEOUT;
    case "BAD_GATEWAY":
    case "SERVICE_UNAVAILABLE":
      return ORPC_ERROR_MESSAGE_KEYS.NETWORK;
    default:
      break;
  }

  return ORPC_ERROR_MESSAGE_KEYS.GENERIC;
}
