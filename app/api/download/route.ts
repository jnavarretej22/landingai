/**
 * POST /api/download
 * Form body: html=<string>, filename=<string>
 * Returns the HTML as a proper file download with correct filename.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const html = formData.get('html');
    const filename = formData.get('filename') || 'mi-pagina-web.html';

    if (!html || typeof html !== 'string') {
      return new Response('Missing html field', { status: 400 });
    }

    const safeFilename = String(filename).replace(/[^a-zA-Z0-9\-_.]/g, '_');
    const finalFilename = safeFilename.endsWith('.html') ? safeFilename : `${safeFilename}.html`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type':        'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Cache-Control':       'no-store',
      },
    });
  } catch {
    return new Response('Server error', { status: 500 });
  }
}
