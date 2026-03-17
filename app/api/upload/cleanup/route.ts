import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

/**
 * POST /api/upload/cleanup
 * Body: { urls: string[] }  (e.g. ["/uploads/123456-foto.jpg"])
 * Deletes the files from /public/uploads (called on download or page unload)
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const { urls } = JSON.parse(body || '{}') as { urls?: string[] };

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    let deleted = 0;
    for (const url of urls) {
      try {
        // url is like /uploads/timestamp-filename.jpg — strip query params & sanitize
        const filename = path.basename(url.split('?')[0]);
        if (!filename || filename.includes('..')) continue; // safety check
        const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
        await unlink(filepath);
        deleted++;
      } catch { /* file already deleted or not found — ignore */ }
    }

    return NextResponse.json({ success: true, deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Cleanup error:', message);
    return NextResponse.json({ success: false, deleted: 0 });
  }
}
