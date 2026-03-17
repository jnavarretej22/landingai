/**
 * POST /api/download
 * Form body: html=<string>
 * Returns the HTML as a proper file download with correct filename.
 * Using form POST instead of blob URLs avoids Chrome's blob-UUID filename bug.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const html = formData.get('html');

    if (!html || typeof html !== 'string') {
      return new Response('Missing html field', { status: 400 });
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type':        'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="landing-page.html"',
        'Cache-Control':       'no-store',
      },
    });
  } catch {
    return new Response('Server error', { status: 500 });
  }
}
