import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { AppError, ValidationError } from "./errors";

// Wrap every endpoint's logic in this. It catches anything thrown inside
// and turns it into a consistent JSON reply.
export function route<Context = unknown>(
  handler: (request: Request, context: Context) => Promise<Response> | Response,
) {
  return async (request: Request, context: Context): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // An error we threw on purpose: send its details back.
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { code: error.code, message: error.message, details: error.details } },
          { status: error.status },
        );
      }

      // Anything else is a bug. Log it for ourselves; send back nothing sensitive.
      console.error("Unhandled error:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
        { status: 500 },
      );
    }
  };
}

// Read the request's JSON body and check it against a Zod schema.
// Returns clean, trusted data, or throws a ValidationError.
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ValidationError(
      "Invalid request",
      result.error.issues.map((issue) => ({
        field: issue.path.map(String).join("."),
        message: issue.message,
      })),
    );
  }
  return result.data;
}