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
      await fs.access(absolutePath);

      await fs.unlink(absolutePath);
      return NextResponse.json({ message: 'File deleted successfully' }, { status: 200 });
    } catch (_err) {
      return NextResponse.json(
        { message: 'File does not exist, skipping delete' },
        { status: 200 },
      );
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}
