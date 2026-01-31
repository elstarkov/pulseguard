import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

const httpUrl = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (u) => u.startsWith("http://") || u.startsWith("https://"),
    "URL must use http or https",
  );

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
