import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(req: Request) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const absolutePath = path.join(process.cwd(), 'public', filePath);

    try {
      // Periksa apakah file ada sebelum menghapusnya
      await fs.access(absolutePath);

      // Jika file ada, hapus
      await fs.unlink(absolutePath);
      return NextResponse.json({ message: 'File deleted successfully' }, { status: 200 });
    } catch (err) {
      // Jika file tidak ditemukan, lewati penghapusan dan return sukses
      return NextResponse.json(
        { message: 'File does not exist, skipping delete' },
        { status: 200 },
      );
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}
