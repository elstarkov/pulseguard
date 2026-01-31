"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Check {
  id: string;
  statusCode: number | null;
  responseTime: number | null;
  success: boolean;
  message: string | null;
  createdAt: string;
}

interface Monitor {
  id: string;
  name: string;
  url: string;
  interval: number;
  status: string;
  lastCheckedAt: string | null;
  createdAt: string;
  checks: Check[];
}

export default function MonitorDetail() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonitor = useCallback(async () => {
    const res = await fetch(`/api/monitors/${params.id}`);
    if (res.ok) {
      setMonitor(await res.json());
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (status === "authenticated") {
      fetchMonitor();
    }
  }, [status, router, fetchMonitor]);

  if (loading || !monitor) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const successChecks = monitor.checks.filter((c) => c.success).length;
  const uptimePercent =
    monitor.checks.length > 0
      ? ((successChecks / monitor.checks.length) * 100).toFixed(1)
      : "—";
  const checksWithResponseTime = monitor.checks.filter(
    (c) => c.responseTime !== null,
  );
  const avgResponseTime =
    checksWithResponseTime.length > 0
      ? Math.round(
          checksWithResponseTime.reduce(
            (sum, c) => sum + (c.responseTime || 0),
            0,
          ) / checksWithResponseTime.length,
        )
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-zinc-800">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-white tracking-tight"
        >
          Pulse<span className="text-emerald-400">Guard</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition mb-6 inline-block"
        >
          &larr; Back to monitors
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{monitor.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">{monitor.url}</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              monitor.status === "up"
                ? "bg-emerald-400/10 text-emerald-400"
                : monitor.status === "down"
                  ? "bg-red-400/10 text-red-400"
                  : "bg-zinc-700 text-zinc-400"
            }`}
          >
            {monitor.status === "up"
              ? "Operational"
              : monitor.status === "down"
                ? "Down"
                : "Pending"}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-sm text-zinc-400 mb-1">Uptime</div>
            <div className="text-2xl font-bold text-white">
              {uptimePercent}%
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-sm text-zinc-400 mb-1">Avg response</div>
            <div className="text-2xl font-bold text-white">
              {avgResponseTime !== null ? `${avgResponseTime}ms` : "—"}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-sm text-zinc-400 mb-1">Total checks</div>
            <div className="text-2xl font-bold text-white">
              {monitor.checks.length}
            </div>
          </div>
        </div>

        {/* Response time bars */}
        {monitor.checks.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">
              Response time (last {monitor.checks.length} checks)
            </h2>
            <div className="flex items-end gap-1 h-24">
              {[...monitor.checks].reverse().map((check) => {
                const maxTime = Math.max(
                  ...monitor.checks
                    .filter((c) => c.responseTime !== null)
                    .map((c) => c.responseTime || 0),
                  1,
                );
                const height = check.responseTime
                  ? (check.responseTime / maxTime) * 100
                  : 2;
                return (
                  <div
                    key={check.id}
                    className={`flex-1 min-w-[3px] rounded-sm ${
                      check.success ? "bg-emerald-400" : "bg-red-400"
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${check.responseTime}ms - ${check.success ? "OK" : "Failed"}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Check log */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent checks
          </h2>
          {monitor.checks.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No checks recorded yet. Checks will appear after the first run.
            </p>
          ) : (
            <div className="space-y-2">
              {monitor.checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        check.success ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <span className="text-sm text-zinc-300">
                      {check.statusCode || "—"}{" "}
                      {check.message && (
                        <span className="text-zinc-500">
                          &middot; {check.message}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-400">
                      {check.responseTime !== null
                        ? `${check.responseTime}ms`
                        : "—"}
                    </span>
                    <span className="text-zinc-600">
                      {new Date(check.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
