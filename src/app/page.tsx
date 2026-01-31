import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-xl font-bold text-white tracking-tight">
          Pulse<span className="text-emerald-400">Guard</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/signin"
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block px-3 py-1 mb-6 text-xs font-medium text-emerald-400 bg-emerald-400/10 rounded-full border border-emerald-400/20">
          Uptime monitoring made simple
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          Know when your site
          <br />
          <span className="text-emerald-400">goes down</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
          Monitor your websites and APIs around the clock. Get instant alerts
          when things break. Share beautiful status pages with your users.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition"
          >
            Start monitoring — free
          </Link>
          <Link
            href="#features"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition"
          >
            See features
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything you need
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "HTTP Monitoring",
              desc: "Check any URL at configurable intervals. We track response codes, latency, and availability.",
              icon: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9 9 0 0 1 3 12c0-1.47.353-2.856.978-4.082",
            },
            {
              title: "Instant Alerts",
              desc: "Get notified the moment something goes wrong. Never let your users discover downtime before you do.",
              icon: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",
            },
            {
              title: "Status Pages",
              desc: "Generate a public status page your customers can check. Build trust with full transparency.",
              icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
            >
              <div className="w-10 h-10 bg-emerald-400/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={f.icon}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-zinc-500">
          <span>PulseGuard</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
