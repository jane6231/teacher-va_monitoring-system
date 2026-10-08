import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6 text-neutral-900">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-purple-100 text-center space-y-6">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-md text-white">
          🌸
        </div>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Teacher & VA Portal</h1>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Manage your online teaching classes, student schedules, invoices, and VA tasks all in one seamless dashboard.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/auth/sign-up"
            className="w-full block py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition"
          >
            Get Started / Sign Up
          </Link>
          <Link
            href="/auth/login"
            className="w-full block py-3 px-4 bg-neutral-100 text-neutral-700 font-bold text-sm rounded-xl hover:bg-neutral-200 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}