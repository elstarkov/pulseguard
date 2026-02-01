import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMonitorSchema } from "@/lib/schemas";
import { logError } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const monitors = await prisma.monitor.findMany({
      where: { userId },
      include: {
        checks: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { checks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(monitors);
  } catch (error) {
    logError({ route: "GET /api/monitors", operation: "findMonitors" }, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const userId = (session.user as { id: string }).id;

  try {
    const monitor = await prisma.monitor.create({
      data: { ...parsed.data, userId },
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch (error) {
    logError(
      { route: "POST /api/monitors", operation: "createMonitor" },
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
