import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMonitorSchema } from "@/lib/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
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
  const monitor = await prisma.monitor.create({
    data: { ...parsed.data, userId },
  });

  return NextResponse.json(monitor, { status: 201 });
}
