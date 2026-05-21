import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  const { data: org } = profile.organization_id
    ? await supabase
        .from('organizations')
        .select('name, tier')
        .eq('id', profile.organization_id)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-sm font-semibold tracking-tight text-zinc-900">Charge</span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/dashboard" className="text-sm text-zinc-700 hover:text-zinc-900">
                Overview
              </Link>
              <Link href="/chargers" className="text-sm text-zinc-700 hover:text-zinc-900">
                Chargers
              </Link>
              <Link href="/sessions" className="text-sm text-zinc-700 hover:text-zinc-900">
                Sessions
              </Link>
              <Link href="/reimbursements" className="text-sm text-zinc-700 hover:text-zinc-900">
                Reimbursements
              </Link>
              <Link href="/employees" className="text-sm text-zinc-700 hover:text-zinc-900">
                Employees
              </Link>
              <Link href="/billing" className="text-sm text-zinc-700 hover:text-zinc-900">
                Billing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-zinc-500">{org?.name ?? '—'}</div>
              <div className="text-xs text-zinc-900">{profile.email}</div>
            </div>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-xs text-zinc-700 hover:text-zinc-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
