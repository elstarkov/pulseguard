import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateMonitorSchema } from "@/lib/schemas";
import { logError } from "@/lib/logger";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  try {
    const monitor = await prisma.monitor.findFirst({
      where: { id, userId },
      include: {
        checks: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    logError(
      { route: "GET /api/monitors/[id]", operation: "findMonitor" },
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const parsed = updateMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  try {
    const existing = await prisma.monitor.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const monitor = await prisma.monitor.update({
      where: { id, userId },
      data: parsed.data,
    });

    return NextResponse.json(monitor);
  } catch (error) {
    logError(
      { route: "PATCH /api/monitors/[id]", operation: "updateMonitor" },
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  try {
    const existing = await prisma.monitor.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.monitor.delete({ where: { id, userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(
      { route: "DELETE /api/monitors/[id]", operation: "deleteMonitor" },
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
