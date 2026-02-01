import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logError, logInfo } from "@/lib/logger";

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

  const results = [];
  let failed = 0;

  for (const monitor of monitors) {
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

    const responseTime = Date.now() - start;

    try {
      const check = await prisma.check.create({
        data: {
          monitorId: monitor.id,
          statusCode,
          responseTime,
          success,
          message,
        },
      });

      const newStatus = success ? "up" : "down";
      await prisma.monitor.update({
        where: { id: monitor.id },
        data: { status: newStatus, lastCheckedAt: new Date() },
      });

      results.push({
        monitorId: monitor.id,
        name: monitor.name,
        status: newStatus,
        responseTime,
        checkId: check.id,
      });
    } catch (error) {
      failed++;
      logError(
        {
          route: "GET /api/checks/run",
          operation: "saveCheckResult",
          monitorId: monitor.id,
          monitorName: monitor.name,
        },
        error,
      );
    }
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
