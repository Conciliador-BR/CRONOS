import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Encerra a sessão. Use com <form action="/auth/signout" method="post">. */
export async function POST(request: NextRequest) {
  // Bloqueia logout forçado por outro site (CSRF).
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  // 303: o navegador segue com GET depois do POST.
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
