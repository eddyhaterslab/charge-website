import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Route protection + role gating
 *
 * - /(dashboard)/*   → requires authenticated user
 * - /(admin)/*       → requires role=super_admin
 * - /(pop)/*         → requires role=pop
 * - /(installer)/*   → requires role=installer
 * - everything else  → public (marketing)
 */
export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Public routes
  const isMarketing = path === '/' || path.startsWith('/login') || path.startsWith('/signup');
  if (isMarketing) return response;

  // Auth gate
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Role gate — fetch profile role once
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // First login without profile created yet — kick to onboarding
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/admin') && profile.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (path.startsWith('/pop') && profile.role !== 'pop' && profile.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (path.startsWith('/installer') && profile.role !== 'installer' && profile.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron).*)',
  ],
};
