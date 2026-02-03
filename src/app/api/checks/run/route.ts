import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logError, logInfo } from "@/lib/logger";

const CONCURRENCY = 10;

interface CheckResult {
  monitorId: string;
  monitorName: string;
  statusCode: number | null;
  responseTime: number;
  success: boolean;
  message: string | null;
}

async function checkMonitor(monitor: {
  id: string;
  name: string;
  url: string;
}): Promise<CheckResult> {
  const start = Date.now();
  let statusCode: number | null = null;
  let success = false;
  let message: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(monitor.url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    statusCode = res.status;
    success = res.status >= 200 && res.status < 400;
  } catch (err) {
    message = err instanceof Error ? err.message : "Unknown error";
    success = false;
  }

  return {
    monitorId: monitor.id,
    monitorName: monitor.name,
    statusCode,
    responseTime: Date.now() - start,
    success,
    message,
  };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimit("cron:run", 1, 30_000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  let monitors;
  try {
    monitors = await prisma.monitor.findMany();
  } catch (error) {
    logError(
      { route: "GET /api/checks/run", operation: "findMonitors" },
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  let failed = 0;
  const results: {
    monitorId: string;
    name: string;
    status: string;
    responseTime: number;
  }[] = [];

  for (let i = 0; i < monitors.length; i += CONCURRENCY) {
    const batch = monitors.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(checkMonitor));
    const chunk = settled
      .filter(
        (result): result is PromiseFulfilledResult<CheckResult> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);
    if (chunk.length === 0) {
      continue;
    }

    try {
      await prisma.$transaction([
        prisma.check.createMany({
          data: chunk.map((r) => ({
            monitorId: r.monitorId,
            statusCode: r.statusCode,
            responseTime: r.responseTime,
            success: r.success,
            message: r.message,
          })),
        }),
        ...chunk.map((r) =>
          prisma.monitor.update({
            where: { id: r.monitorId },
            data: {
              status: r.success ? "up" : "down",
              lastCheckedAt: new Date(),
            },
          }),
        ),
      ]);

      for (const r of chunk) {
        results.push({
          monitorId: r.monitorId,
          name: r.monitorName,
          status: r.success ? "up" : "down",
          responseTime: r.responseTime,
        });
      }
    } catch (error) {
      failed += chunk.length;
      logError(
        {
          route: "GET /api/checks/run",
          operation: "batchSaveResults",
        },
        error,
      );
    }
  }

  if (results.length === 0 && failed === 0) {
    logInfo({
      route: "GET /api/checks/run",
      operation: "cronSummary",
      totalMonitors: monitors.length,
      checked: 0,
      failed: 0,
    });
    return NextResponse.json({ checked: 0, results: [] });
  }

  logInfo({
    route: "GET /api/checks/run",
    operation: "cronSummary",
    totalMonitors: monitors.length,
    checked: results.length,
    failed,
  });

  return NextResponse.json({ checked: results.length, results });
}
