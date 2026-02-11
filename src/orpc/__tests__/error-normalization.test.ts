import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

import {
  classifyORPCErrorKind,
  toUserSafeORPCError,
} from "@/orpc/error-normalization";

describe("classifyORPCErrorKind", () => {
  it("classifies provider quota errors", () => {
    const error = new Error(
      "Failed after 3 attempts. You exceeded your current quota."
    );

    expect(classifyORPCErrorKind(error)).toBe("PROVIDER_QUOTA");
  });

  it("classifies timeout errors", () => {
    const error = new Error("Request timed out");

    expect(classifyORPCErrorKind(error)).toBe("TIMEOUT");
  });

  it("classifies network errors", () => {
    const error = new TypeError("fetch failed");

    expect(classifyORPCErrorKind(error)).toBe("NETWORK");
  });

  it("classifies unknown errors as unexpected", () => {
    const error = new Error("something else");

    expect(classifyORPCErrorKind(error)).toBe("UNEXPECTED");
  });
});

describe("toUserSafeORPCError", () => {
  it("keeps known safe ORPC errors unchanged", () => {
    const original = new ORPCError("BAD_REQUEST", {
      message: "Known safe validation guidance",
    });

    const normalized = toUserSafeORPCError(original, {
      procedure: "admin.applications.reprocessCv",
    });

    expect(normalized).toBe(original);
  });

  it("maps internal provider quota errors to user-safe errors", () => {
    const normalized = toUserSafeORPCError(
      new Error(
        "Failed after 3 attempts. You exceeded your current quota. https://platform.openai.com/docs"
      ),
      { procedure: "admin.applications.reprocessCv" }
    );

    expect(normalized.code).toBe("TOO_MANY_REQUESTS");
    expect(normalized.message).toBe("AI service is currently unavailable.");
    expect(String(normalized.message)).not.toContain("quota");
    expect(normalized.data).toMatchObject({
      kind: "PROVIDER_QUOTA",
      procedure: "admin.applications.reprocessCv",
    });
  });
});
