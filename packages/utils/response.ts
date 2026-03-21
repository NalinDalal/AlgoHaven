type ResponseStatus = "success" | "error";

interface ApiResponseOptions<T> {
  status?: ResponseStatus;
  message?: string;
  data?: T | null;
  error?: string | null;
  statusCode?: number;
}

export function createResponse<T>({
  status = "success",
  message = "OK",
  data = null,
  error = null,
  statusCode,
}: ApiResponseOptions<T>): Response {
  const body = {
    status,
    message,
    data,
    error,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: statusCode ?? (status === "success" ? 200 : 400),
    headers: { "Content-Type": "application/json" },
  });
}

export function success<T>(
  message: string,
  data?: T,
  statusCode = 200,
): Response {
  return createResponse({ status: "success", message, data, statusCode });
}

export function failure(
  message: string,
  error: string | null = null,
  statusCode = 400,
): Response {
  return createResponse({ status: "error", message, error, statusCode });
}
