/**
 * Structured logging utility
 * Ensures no PHI is logged in plaintext
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Sanitize metadata to ensure no PHI is logged
 */
function sanitizeMetadata(metadata: any): Record<string, any> {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const sanitized: Record<string, any> = {};
  const allowedKeys = [
    "userId",
    "staffId",
    "patientId",
    "method",
    "endpoint",
    "statusCode",
    "ip",
    "userAgent",
    "timestamp",
    "duration",
    "errorCode",
  ];

  // PHI keys that should never be logged
  const phiKeys = [
    "plaintext",
    "decrypted",
    "data",
    "medicalData",
    "record",
    "blob",
    "mnemonic",
    "masterKey",
    "fragment",
    "token",
    "password",
    "email",
  ];

  for (const key in metadata) {
    const lowerKey = key.toLowerCase();

    // Skip PHI keys
    if (phiKeys.some((phiKey) => lowerKey.includes(phiKey))) {
      continue;
    }

    // Only include allowed keys
    if (allowedKeys.includes(key)) {
      sanitized[key] = metadata[key];
    }
  }

  return sanitized;
}

/**
 * Format log entry as JSON
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Logger class for structured logging
 */
class Logger {
  private service: string;

  constructor(service: string = "mediqr-server") {
    this.service = service;
  }

  private log(level: LogLevel, message: string, metadata?: any, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      metadata: metadata ? sanitizeMetadata(metadata) : undefined,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack:
              process.env.NODE_ENV === "development" ? error.stack : undefined,
          }
        : undefined,
    };

    const formatted = formatLog(entry);

    // Use appropriate console method
    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  info(message: string, metadata?: any) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log("warn", message, metadata);
  }

  error(message: string, error?: Error, metadata?: any) {
    this.log("error", message, metadata, error);
  }

  debug(message: string, metadata?: any) {
    this.log("debug", message, metadata);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom loggers
export { Logger };
