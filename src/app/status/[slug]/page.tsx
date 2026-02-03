import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { logError } from "@/lib/logger";

export const revalidate = 60;

interface Check {
  success: boolean;
  createdAt: Date;
}

interface MonitorWithChecks {
  id: string;
  name: string;
  status: string;
  checks: Check[];
}

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let page;
  try {
    page = await prisma.statusPage.findUnique({
      where: { slug },
      include: {
        monitors: {
          include: {
            checks: {
              select: { success: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 90,
            },
          },
        },
      },
    });
  } catch (error) {
    logError({ route: "status/[slug]", operation: "findStatusPage" }, error);
    notFound();
  }

  if (!page || !page.isPublic) {
    notFound();
  }

  const allUp = page.monitors.every(
    (m: MonitorWithChecks) => m.status === "up",
  );
  const anyDown = page.monitors.some(
    (m: MonitorWithChecks) => m.status === "down",
  );

  function getUptime(monitor: MonitorWithChecks) {
    if (monitor.checks.length === 0) return null;
    const successful = monitor.checks.filter((c: Check) => c.success).length;
    return ((successful / monitor.checks.length) * 100).toFixed(2);
  }

  function getUptimeBars(monitor: MonitorWithChecks) {
    const days: boolean[] = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayChecks = monitor.checks.filter((c: Check) => {
        const t = new Date(c.createdAt);
        return t >= dayStart && t < dayEnd;
      });

      if (dayChecks.length === 0) {
        days.push(true); // no data = assume ok
      } else {
        days.push(dayChecks.every((c: Check) => c.success));
      }
    }
    return days;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">{page.title}</h1>
          {page.description && (
            <p className="text-zinc-400 mt-2">{page.description}</p>
          )}
          <div
            className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-sm font-medium ${
              allUp
                ? "bg-emerald-400/10 text-emerald-400"
                : anyDown
                  ? "bg-red-400/10 text-red-400"
                  : "bg-yellow-400/10 text-yellow-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                allUp
                  ? "bg-emerald-400"
                  : anyDown
                    ? "bg-red-400"
                    : "bg-yellow-400"
              }`}
            />
            {allUp
              ? "All systems operational"
              : anyDown
                ? "Some systems are down"
                : "Some systems degraded"}
          </div>
        </div>

        <div className="space-y-6 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
          {page.monitors.map((monitor: MonitorWithChecks) => {
            const uptime = getUptime(monitor);
            const bars = getUptimeBars(monitor);

            return (
              <div
                key={monitor.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        monitor.status === "up"
                          ? "bg-emerald-400"
                          : monitor.status === "down"
                            ? "bg-red-400"
                            : "bg-zinc-500"
                      }`}
                    />
                    <span className="text-white font-medium">
                      {monitor.name}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-400">
                    {uptime !== null ? `${uptime}% uptime` : "No data"}
                  </span>
                </div>

                {/* 90-day uptime bar */}
                <div className="flex gap-[2px]">
                  {bars.map((ok, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded-sm ${
                        ok ? "bg-emerald-400/80" : "bg-red-400/80"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-zinc-600">90 days ago</span>
                  <span className="text-xs text-zinc-600">Today</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-zinc-600">
          Powered by PulseGuard
        </div>
      </div>
    </div>
  );
}
