'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function VADashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('charcoal');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const savedTheme = localStorage.getItem('va_dashboard_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [router, supabase]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('va_dashboard_theme', newTheme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-up');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-neutral-100 text-neutral-800 font-medium">Loading VA portal...</div>;
  }

  // 5 Theme Options including Pink & Colorful
  const themes: any = {
    charcoal: {
      bgMain: 'bg-[#FAFAFA]',
      sidebar: 'bg-neutral-900 text-neutral-100 border-neutral-800',
      brandBox: 'bg-neutral-800 border-neutral-700',
      brandIcon: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      navActive: 'bg-amber-600 text-white shadow-md',
      navInactive: 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
      accentBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-neutral-200',
      textMuted: 'text-neutral-500',
      currencyColor: 'text-amber-600',
    },
    teal: {
      bgMain: 'bg-[#F4FBFB]',
      sidebar: 'bg-teal-950 text-teal-100 border-teal-900',
      brandBox: 'bg-teal-900 border-teal-800',
      brandIcon: 'bg-teal-800 text-teal-200',
      navActive: 'bg-teal-600 text-white shadow-md',
      navInactive: 'text-teal-200 hover:bg-teal-900 hover:text-white',
      accentBtn: 'bg-teal-600 hover:bg-teal-700 text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-teal-100',
      textMuted: 'text-teal-700',
      currencyColor: 'text-teal-700',
    },
    indigo: {
      bgMain: 'bg-slate-50',
      sidebar: 'bg-slate-900 text-slate-100 border-slate-800',
      brandBox: 'bg-slate-800 border-slate-700',
      brandIcon: 'bg-indigo-600 text-white',
      navActive: 'bg-indigo-600 text-white shadow-md',
      navInactive: 'text-slate-300 hover:bg-slate-800 hover:text-white',
      accentBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      textMuted: 'text-slate-500',
      currencyColor: 'text-indigo-600',
    },
    pink: {
      bgMain: 'bg-[#FFF5F7]',
      sidebar: 'bg-[#700F37] text-white border-[#8A1344]',
      brandBox: 'bg-[#8A1344] border-[#A21952]',
      brandIcon: 'bg-amber-300 text-neutral-900',
      navActive: 'bg-[#FF2E7E] text-white shadow-md',
      navInactive: 'text-pink-100 hover:bg-[#8A1344]',
      accentBtn: 'bg-[#FF2E7E] hover:bg-[#e0226e] text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-pink-100',
      textMuted: 'text-pink-700',
      currencyColor: 'text-[#FF2E7E]',
    },
    colorful: {
      bgMain: 'bg-gradient-to-br from-pink-50/60 via-purple-50/60 to-indigo-50/60',
      sidebar: 'bg-gradient-to-b from-purple-950 via-indigo-950 to-pink-950 text-white border-purple-900',
      brandBox: 'bg-white/10 border-white/20 backdrop-blur-sm',
      brandIcon: 'bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-md',
      navActive: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md',
      navInactive: 'text-purple-200 hover:bg-white/10 hover:text-white',
      accentBtn: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md',
      cardBg: 'bg-white/90 backdrop-blur-sm',
      cardBorder: 'border-purple-100',
      textMuted: 'text-purple-700',
      currencyColor: 'text-pink-600',
    }
  };

  const t = themes[theme] || themes.charcoal;

  const calendarDays = [
    ...Array(3).fill(null),
    ...Array.from({ length: 31 }, (_, i) => i + 1)
  ];

  return (
    <div className={`flex min-h-screen ${t.bgMain} text-neutral-900 transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className={`w-64 ${t.sidebar} flex flex-col justify-between p-6 shadow-md fixed h-full z-10 border-r`}>
        <div>
          <div className={`flex items-center gap-3 mb-8 ${t.brandBox} p-3 rounded-xl border`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner ${t.brandIcon}`}>
              {theme === 'charcoal' ? '💼' : theme === 'teal' ? '🚀' : theme === 'indigo' ? '⚡' : theme === 'pink' ? '🌸' : '🌈'}
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">VA & Freelance</h2>
              <p className="text-xs opacity-75">Client Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'dashboard' ? t.navActive : t.navInactive}`}>📊 My Dashboard</button>
            <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'tasks' ? t.navActive : t.navInactive}`}>📋 Client Tasks</button>
            <button onClick={() => setActiveTab('tracker')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'tracker' ? t.navActive : t.navInactive}`}>⏱️ Time Tracker</button>
            <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'projects' ? t.navActive : t.navInactive}`}>📁 Projects</button>
            <button onClick={() => setActiveTab('invoices')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'invoices' ? t.navActive : t.navInactive}`}>💳 Invoices & Billing</button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'reports' ? t.navActive : t.navInactive}`}>📈 Reports</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'settings' ? t.navActive : t.navInactive}`}>⚙️ Account Settings</button>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 opacity-75 hover:opacity-100 px-4 py-2 text-sm font-medium transition mt-auto border-t border-current/20 pt-4">🚪 Sign Out</button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        {activeTab === 'dashboard' && (
          <>
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8`}>
              <div>
                <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">Virtual Assistant Dashboard 🚀</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage your active client tasks, logged hours, and billing</p>
              </div>
              <div className="flex items-center gap-2 bg-neutral-100/80 p-1.5 rounded-xl border border-neutral-200 text-sm font-medium">
                <button className="px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-white transition">Today</button>
                <button className="px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-white transition">This Week</button>
                <button className={`px-3 py-1.5 rounded-lg text-white shadow-xs ${t.accentBtn}`}>This Month</button>
                <button className="px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-white transition">This Year</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder} relative`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>ACTIVE CLIENTS</span><p className="text-3xl font-black text-neutral-900 mt-3">0</p><p className="text-xs text-neutral-500 font-medium mt-1">Clients</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>TASKS DUE TODAY</span><p className="text-3xl font-black text-neutral-900 mt-3">0</p><p className="text-xs text-neutral-500 font-medium mt-1">Pending items</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>LOGGED HOURS</span><p className="text-3xl font-black text-neutral-900 mt-3">0.0</p><p className="text-xs text-neutral-500 font-medium mt-1">Hours</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>REVENUE & INVOICES</span><p className={`text-2xl font-black ${t.currencyColor} mt-3`}>₱0</p><p className="text-xs text-neutral-500 font-medium mt-1">0 invoices paid</p></div>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} mb-8`}>
              <h2 className="text-base font-bold text-neutral-900 mb-4">📋 Tasks & Schedule for Today</h2>
              <div className="p-8 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl"><p className="text-sm font-medium text-neutral-500">No tasks scheduled for today yet.</p></div>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
              <h2 className="text-xl font-black text-neutral-900 mb-6">October 2026</h2>
              <div className={`grid grid-cols-7 text-center font-bold text-xs ${t.textMuted} py-3 border-b border-neutral-100`}><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
              <div className="grid grid-cols-7 gap-2 pt-4">
                {calendarDays.map((day, index) => (
                  <div key={index} className={`h-24 p-2 border rounded-xl flex flex-col justify-between ${day ? `${t.cardBorder}${t.cardBg} shadow-xs` : 'border-neutral-100 bg-neutral-50/40'}`}>
                    {day && <span className="text-xs font-bold text-neutral-700">{day}</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'tasks' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-black text-neutral-900">📋 Client Tasks</h1><p className="text-sm text-neutral-500 mt-0.5">Track daily task lists, deadlines, and priorities</p></div><button className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}>+ Add Task</button></div>
            <div className="p-12 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl"><p className="text-sm font-medium text-neutral-500">No tasks added yet.</p></div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-black text-neutral-900">⏱️ Time Tracker</h1><p className="text-sm text-neutral-500 mt-0.5">Log billable hours and monitor active task timers</p></div><button className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}>+ Start Timer</button></div>
            <div className="p-12 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl"><p className="text-sm font-medium text-neutral-500">No time entries recorded.</p></div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-black text-neutral-900">📁 Projects & Retainers</h1><p className="text-sm text-neutral-500 mt-0.5">Manage ongoing client retainers and milestones</p></div><button className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}>+ New Project</button></div>
            <div className="p-12 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl"><p className="text-sm font-medium text-neutral-500">No projects set up yet.</p></div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <div className="flex justify-between items-center mb-6"><div><h1 className="text-2xl font-black text-neutral-900">💳 Invoices & Billing</h1><p className="text-sm text-neutral-500 mt-0.5">Generate client invoices and track payments (₱)</p></div><button className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}>+ Create Invoice</button></div>
            <div className="p-12 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl"><p className="text-sm font-medium text-neutral-500">No invoices generated yet.</p></div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <h1 className="text-2xl font-black text-neutral-900 mb-1">📈 Performance Reports</h1><p className="text-sm text-neutral-500 mb-6">Monthly analytics on billable hours and earnings</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-neutral-50/50 rounded-2xl border border-neutral-200"><h3 className="font-bold text-neutral-800 mb-2">Total Monthly Logged Hours</h3><p className={`text-3xl font-black ${t.currencyColor}`}>0.0 hrs</p></div>
              <div className="p-6 bg-neutral-50/50 rounded-2xl border border-neutral-200"><h3 className="font-bold text-neutral-800 mb-2">Total Monthly Revenue</h3><p className={`text-3xl font-black ${t.currencyColor}`}>₱0</p></div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} max-w-2xl`}>
            <h1 className="text-2xl font-black text-neutral-900 mb-1">⚙️ Account Settings</h1>
            <p className="text-sm text-neutral-500 mb-6">Manage profile and dashboard appearance theme</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Dashboard Theme Customizer</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button onClick={() => handleThemeChange('charcoal')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'charcoal' ? 'border-amber-600 bg-amber-50/50 text-neutral-900 ring-2 ring-amber-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>💼 Charcoal & Amber</button>
                  <button onClick={() => handleThemeChange('teal')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'teal' ? 'border-teal-600 bg-teal-50/50 text-teal-900 ring-2 ring-teal-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌿 Modern Teal</button>
                  <button onClick={() => handleThemeChange('indigo')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'indigo' ? 'border-indigo-600 bg-indigo-50/50 text-neutral-900 ring-2 ring-indigo-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🎓 Ocean Indigo</button>
                  <button onClick={() => handleThemeChange('pink')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'pink' ? 'border-[#FF2E7E] bg-pink-50/50 text-neutral-900 ring-2 ring-pink-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌸 Vibrant Pink</button>
                  <button onClick={() => handleThemeChange('colorful')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'colorful' ? 'border-purple-600 bg-purple-50/50 text-neutral-900 ring-2 ring-purple-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌈 Colorful Gradient</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email Address</label>
                <input type="email" disabled value={user?.email || ''} className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-600" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Default Hourly Rate (₱)</label>
                <input type="number" defaultValue="600" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900" />
              </div>

              <button className={`px-5 py-2.5 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}>Save Changes</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}