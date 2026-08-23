import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSignedDownloadUrl } from "@/lib/storage/r2";

// Avatars live in private R2 storage; this handler gates access behind the session.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { path } = await params;

  if (!path || path.length === 0 || path.some((segment) => !segment || segment.includes(".."))) {
    return NextResponse.json({ error: "Invalid avatar path." }, { status: 400 });
  }

  try {
    const url = await getSignedDownloadUrl("avatars", path.join("/"));
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Failed to resolve avatar", error);
    return NextResponse.json({ error: "Failed to load avatar." }, { status: 500 });
  }
}
