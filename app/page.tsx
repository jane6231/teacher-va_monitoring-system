
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-neutral-900">

      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm text-center space-y-6">

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Teacher & VA Portal
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Manage your online teaching classes, student schedules,
            invoices, and VA tasks all in one seamless dashboard.
          </p>
        </div>

        <div className="space-y-3 pt-2">

          <Link
            href="/auth/sign-up"
            className="block w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Get Started / Sign Up
          </Link>

          <Link
            href="/auth/login"
            className="block w-full rounded-md bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
          >
            Sign In
          </Link>

        </div>

      </div>
    </div>
  );
}
