import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value }) =>
            response.cookies.set(name, value)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();

  // 1. Se utente non autenticato tenta di accedere a rotte protette -> Redirect Login
  if (!user && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin'))) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = user.user_metadata?.role || 'investor';

    // 2. Protezione Rotta ADMIN: Solo gli Admin possono accedere a /admin/*
    if (url.pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // 3. Segregazione FORNITORE: I fornitori non navigano la dashboard dell'investitore
    if (role === 'vendor' && url.pathname.startsWith('/dashboard')) {
      url.pathname = '/shared';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/shared/:path*'],
};