import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se ha subido ningún archivo.', code: 'upload_error' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Solo se aceptan imágenes.', code: 'upload_error' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'La imagen es demasiado grande (máx. 5MB). Por favor comprime la imagen antes de subirla.', code: 'upload_error' },
        { status: 413 }
      );
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName  = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename  = `${uniqueSuffix}-${safeName}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;
    const base64  = `data:${file.type};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ success: true, url: fileUrl, base64 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Upload error:', message);
    return NextResponse.json(
      { success: false, error: 'Error al subir el archivo.', code: 'upload_error' },
      { status: 500 }
    );
  }
}
