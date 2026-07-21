import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Visual Side (Left on desktop) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-slate-950 flex-col justify-between p-12 text-white overflow-hidden border-r border-slate-900">
        {/* Background Gradients */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary blur-3xl" />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-white relative z-10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 2C9.5 2 8 4 8 6c0 1.5.5 2.5 1 3.5C8 11 7 13 7 15c0 3 2 5 5 5s5-2 5-5c0-2-1-4-2-5.5.5-1 1-2 1-3.5C16 4 14.5 2 12 2z" />
            </svg>
          </div>
          <span>Dently</span>
        </Link>

        {/* Content */}
        <div className="space-y-4 relative z-10 max-w-sm my-auto">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
            The operating system for modern dental practices.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Calendar management, isolated patient records, custom procedure
            charts, and billing built under a unified workspace.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Dently Inc. All rights reserved.
        </div>
      </div>

      {/* Form Side (Right on desktop) */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/50 relative">
        {/* Mobile Header Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2 font-bold text-xl text-gray-900">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 2C9.5 2 8 4 8 6c0 1.5.5 2.5 1 3.5C8 11 7 13 7 15c0 3 2 5 5 5s5-2 5-5c0-2-1-4-2-5.5.5-1 1-2 1-3.5C16 4 14.5 2 12 2z" />
              </svg>
            </div>
            <span>Dently</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-100/50">
          {children}
        </div>
      </div>
    </div>
  );
}
