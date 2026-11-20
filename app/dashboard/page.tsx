
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "teacher" | "va";

export default function DashboardSelector() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadAccount() {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/auth/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!active) return;

      if (roleError) {
        setError(roleError.message);
        setLoading(false);
        return;
      }

      const validRoles = (data ?? [])
        .map((item) => item.role)
        .filter((role): role is Role =>
          role === "teacher" || role === "va"
        );

      setRoles(validRoles);
      setLoading(false);
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading your account...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back! ✨
          </h1>
          <p className="text-gray-500 mt-2">{email}</p>
          <p className="text-gray-600 mt-4">
            Which dashboard would you like to open?
          </p>
        </div>

        {error && (
          <p className="text-center text-red-600 mb-5">
            Unable to load account permissions: {error}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {roles.includes("teacher") && (
            <button
              onClick={() => router.push("/teacher-dashboard")}
              className="bg-white p-8 rounded-2xl border border-teal-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition text-left"
            >
              <div className="text-5xl mb-5">🍎</div>
              <h2 className="text-xl font-bold text-gray-900">
                Online Teacher
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                Manage students, classes, schedules, books,
                and payments.
              </p>
              <span className="inline-block mt-6 text-teal-700 font-semibold">
                Open Teacher Dashboard →
              </span>
            </button>
          )}

          {roles.includes("va") && (
            <button
              onClick={() => router.push("/va/dashboard")}
              className="bg-white p-8 rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition text-left"
            >
              <div className="text-5xl mb-5">💼</div>
              <h2 className="text-xl font-bold text-gray-900">
                Virtual Assistant
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                Manage clients, tasks, projects, time tracking,
                and invoices.
              </p>
              <span className="inline-block mt-6 text-purple-700 font-semibold">
                Open VA Dashboard →
              </span>
            </button>
          )}
        </div>

        {!error && roles.length === 0 && (
          <p className="text-center text-gray-500 mt-8">
            No dashboard permissions are assigned to this account.
            Please contact the administrator.
          </p>
        )}

        <div className="text-center mt-10">
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.replace("/auth/login");
            }}
            className="text-sm text-gray-500 hover:text-gray-900 underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
