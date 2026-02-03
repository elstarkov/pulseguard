import { isIP } from "node:net";
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const normalized = host.split("%")[0];
  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return true;
  }
  if (normalized === "::1" || normalized === "::") return true;

  const ipType = isIP(normalized);
  if (ipType === 4) {
    const parts = normalized.split(".").map((p) => Number(p));
    if (parts.length === 4 && parts.every((p) => Number.isInteger(p))) {
      const [a, b] = parts;
      if (a === 10 || a === 127 || a === 0) return true;
      if (a === 169 && b === 254) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
    }
  }

  if (ipType === 6) {
    const firstHextet =
      normalized.split(":").find((part) => part.length > 0) ?? "";
    const hextet = firstHextet.padStart(4, "0").toLowerCase();
    const firstByte = hextet.slice(0, 2);
    if (firstByte === "fc" || firstByte === "fd") return true; // fc00::/7
    if (
      hextet.startsWith("fe8") ||
      hextet.startsWith("fe9") ||
      hextet.startsWith("fea") ||
      hextet.startsWith("feb")
    ) {
      return true; // fe80::/10
    }
  }

  return false;
}

const httpUrl = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (u) => u.startsWith("http://") || u.startsWith("https://"),
    "URL must use http or https",
  )
  .refine((u) => {
    try {
      return !isPrivateHost(new URL(u).hostname);
    } catch {
      return false;
    }
  }, "URL must not point to a private or local address");

export const createMonitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: httpUrl,
  interval: z.coerce.number().int().min(30).max(3600).default(300),
});

export const updateMonitorSchema = z.object({
  name: z.string().min(1).optional(),
  url: httpUrl.optional(),
  interval: z.coerce.number().int().min(30).max(3600).optional(),
});

export const createStatusPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  description: z.string().optional(),
  monitorIds: z.array(z.string()).optional(),
});
