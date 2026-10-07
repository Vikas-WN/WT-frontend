import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Retired. This route used to read, write and delete ANY key in the object-storage bucket for anyone holding a
 * cookie named "email" (it only checked that a session cookie existed, not that it was valid), and nothing in the app
 * uses it. Documents are now opened through the backend at /api/v1/documents/download, which checks who may see each
 * file. Left in place as a hard 404 so old links fail cleanly rather than falling through to a page.
 */
const gone = () => NextResponse.json({ error: "Not found." }, { status: 404 });

export const GET = gone;
export const PUT = gone;
export const DELETE = gone;
export const POST = gone;
