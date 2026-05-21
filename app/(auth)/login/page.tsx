import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  async function signIn(formData: FormData) {
    'use server';
    const supabase = createServerSupabase();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const next = (formData.get('next') as string) || '/dashboard';

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
    redirect(next);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="text-sm font-semibold tracking-tight text-zinc-900">Charge</span>
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Access your Charge platform
        </p>

        <form action={signIn} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={searchParams.next ?? ''} />

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-zinc-600">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-2 w-full border-0 border-b border-zinc-300 bg-transparent py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-zinc-600">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-2 w-full border-0 border-b border-zinc-300 bg-transparent py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-0"
            />
          </div>

          {searchParams.error && (
            <div className="text-xs text-red-700">{searchParams.error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Access by invitation. Contact{' '}
          <a href="mailto:hello@charge.be" className="text-zinc-900 underline">
            hello@charge.be
          </a>
        </p>
      </div>
    </div>
  );
}
