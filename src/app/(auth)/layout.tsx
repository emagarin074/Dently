import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2C9.5 2 8 4 8 6c0 1.5.5 2.5 1 3.5C8 11 7 13 7 15c0 3 2 5 5 5s5-2 5-5c0-2-1-4-2-5.5.5-1 1-2 1-3.5C16 4 14.5 2 12 2z" />
          </svg>
        </div>
        Dently
      </Link>
      {children}
    </div>
  )
}
