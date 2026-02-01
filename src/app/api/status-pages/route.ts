import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createStatusPageSchema } from "@/lib/schemas";
import { logError } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const pages = await prisma.statusPage.findMany({
      where: { userId },
      include: { monitors: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pages);
  } catch (error) {
    logError(
      { route: "GET /api/status-pages", operation: "findStatusPages" },
      error,
    );
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

  const parsed = createStatusPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const userId = (session.user as { id: string }).id;
  const { title, slug, description, monitorIds } = parsed.data;

  try {
    const existing = await prisma.statusPage.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already taken" },
        { status: 409 },
      );
    }

    const page = await prisma.statusPage.create({
      data: {
        title,
        slug,
        description: description || null,
        userId,
      },
    });

    if (monitorIds?.length) {
      await prisma.monitor.updateMany({
        where: { id: { in: monitorIds }, userId },
        data: { statusPageId: page.id },
      });
    }

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    logError(
      { route: "POST /api/status-pages", operation: "createStatusPage" },
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
