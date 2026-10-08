'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

const handleRoleSelection = async (role: 'Online Teacher' | 'Virtual Assistant') => {
    // 1. Get current logged-in user safely
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      alert('You are not logged in!');
      router.push('/auth/login');
      return;
    }

    // 2. Save role to the profiles table (added the missing dot before upsert)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role, updated_at: new Date().toISOString() });

    if (error) {
      console.error('Error saving role:', error.message);
      alert('Failed to save role. Please try again.');
      return;
    }

    // 3. Redirect based on role
    if (role === 'Online Teacher') {
      router.push('/teacher-dashboard');
    } else {
      router.push('/va-dashboard');
    }
  };
  return (
    // Your existing JSX UI with buttons hooked up:
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome! What describes you best?</h1>
      <div className="flex gap-4">
        <button 
          onClick={() => handleRoleSelection('Online Teacher')}
          className="px-6 py-3 border rounded-lg hover:bg-gray-100"
        >
          Online Teacher
        </button>
        <button 
          onClick={() => handleRoleSelection('Virtual Assistant')}
          className="px-6 py-3 border rounded-lg hover:bg-gray-100"
        >
          Virtual Assistant
        </button>
      </div>
    </div>
  );
}