type LogContext = {
  route: string;
  operation: string;
  [key: string]: unknown;
};

export function logError(context: LogContext, error: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      ...context,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logInfo(context: LogContext) {
  console.info(
    JSON.stringify({
      level: "info",
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}
