"use client";

import type { TFunction } from "i18next";

import { useTranslation } from "react-i18next";

import { getORPCErrorMessageKey } from "./error-message";

export function toORPCErrorMessage(error: unknown, t: TFunction): string {
  return t(getORPCErrorMessageKey(error));
}

export function useORPCErrorMessage() {
  const { t } = useTranslation();

  return {
    getMessage: (error: unknown) => toORPCErrorMessage(error, t),
  };
}
