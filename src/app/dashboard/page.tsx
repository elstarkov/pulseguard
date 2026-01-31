"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Check {
  id: string;
  statusCode: number | null;
  responseTime: number | null;
  success: boolean;
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
  _count: { checks: number };
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const fetchMonitors = useCallback(async () => {
    const res = await fetch("/api/monitors");
    if (res.ok) {
      setMonitors(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (status === "authenticated") {
      fetchMonitors();
    }
  }, [status, router, fetchMonitors]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        url: form.get("url"),
        interval: Number(form.get("interval")) || 300,
      }),
    });
    if (res.ok) {
      setShowAdd(false);
      fetchMonitors();
    }
    setAddLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this monitor?")) return;
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    fetchMonitors();
  }

  function statusColor(s: string) {
    if (s === "up") return "bg-emerald-400";
    if (s === "down") return "bg-red-400";
    if (s === "degraded") return "bg-yellow-400";
    return "bg-zinc-500";
  }

  function statusLabel(s: string) {
    if (s === "up") return "Operational";
    if (s === "down") return "Down";
    if (s === "degraded") return "Degraded";
    return "Pending";
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-zinc-800">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-white tracking-tight"
        >
          Pulse<span className="text-emerald-400">Guard</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-zinc-500 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Monitors</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {monitors.length} monitor{monitors.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition"
          >
            {showAdd ? "Cancel" : "Add monitor"}
          </button>
        </div>

        {showAdd && (
          <form
            onSubmit={handleAdd}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Name
                </label>
                <input
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="My Website"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  URL
                </label>
                <input
                  name="url"
                  type="url"
                  required
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Interval (seconds)
                </label>
                <select
                  name="interval"
                  defaultValue="300"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                  <option value="1800">30 minutes</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {addLoading ? "Adding..." : "Add monitor"}
            </button>
          </form>
        )}

        {monitors.length === 0 && !showAdd ? (
          <div className="text-center py-20">
            <div className="text-zinc-600 text-lg mb-2">No monitors yet</div>
            <p className="text-zinc-500 text-sm">
              Add your first monitor to start tracking uptime.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {monitors.map((m) => (
              <div
                key={m.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${statusColor(m.status)}`}
                  />
                  <div>
                    <div className="text-white font-medium">{m.name}</div>
                    <div className="text-sm text-zinc-500 mt-0.5">{m.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm text-zinc-300">
                      {statusLabel(m.status)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {m.checks[0]
                        ? `${m.checks[0].responseTime}ms`
                        : "No checks yet"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/monitors/${m.id}`}
                      className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
