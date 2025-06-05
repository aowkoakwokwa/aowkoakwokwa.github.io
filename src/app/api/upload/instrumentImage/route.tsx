import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { createCanvas, loadImage, registerFont } from 'canvas';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('lampiran') as File | null;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (type !== 'issued' && type !== 'return') {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const image = await loadImage(buffer);

    registerFont(path.join(process.cwd(), 'fonts', 'VarelaRound-Regular.ttf'), {
      family: 'Varela Round',
    });

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const timestamp = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());

    ctx.font = '20px "Varela Round"';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    const x = 20;
    const y = 30;

    ctx.strokeText(timestamp, x, y);
    ctx.fillText(timestamp, x, y);

    const ext = path.extname(file.name) || '.png';
    const newFileName = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), `public/images/instrument/${type}`);
    const filePath = path.join(uploadDir, newFileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, canvas.toBuffer());

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName: newFileName,
      path: `/images/instrument/${type}/${newFileName}`,
      type,
    });
  } catch (error: unknown) {
    const message =
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as any).message === 'string'
        ? (error as any).message
        : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
