import { ORPCError } from "@orpc/client";
import { describe, expect, it } from "vitest";

import { getORPCErrorMessageKey } from "@/orpc/error-message";

describe("getORPCErrorMessageKey", () => {
  it("returns generic key for unknown errors", () => {
    expect(getORPCErrorMessageKey(new Error("unexpected"))).toBe(
      "ORPC_ERROR_GENERIC"
    );
  });

  it("maps provider quota errors from typed oRPC data", () => {
    const error = new ORPCError("TOO_MANY_REQUESTS", {
      data: { kind: "PROVIDER_QUOTA" },
    });

    expect(getORPCErrorMessageKey(error)).toBe("ORPC_ERROR_AI_UNAVAILABLE");
  });

  it("maps payload-too-large to file-size guidance", () => {
    const error = new ORPCError("PAYLOAD_TOO_LARGE");

    expect(getORPCErrorMessageKey(error)).toBe("ORPC_ERROR_FILE_TOO_LARGE");
  });

  it("maps unsupported media type to format guidance", () => {
    const error = new ORPCError("UNSUPPORTED_MEDIA_TYPE");

    expect(getORPCErrorMessageKey(error)).toBe("ORPC_ERROR_INVALID_FILE_FORMAT");
  });

  it("maps validation response code", () => {
    const error = new ORPCError("UNPROCESSABLE_CONTENT");

    expect(getORPCErrorMessageKey(error)).toBe("ORPC_ERROR_VALIDATION");
  });
});
