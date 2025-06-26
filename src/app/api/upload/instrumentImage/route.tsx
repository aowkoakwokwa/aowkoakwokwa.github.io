import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO!;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_FOLDER_PATH = 'public/images/instrument';

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

    ctx.strokeText(timestamp, 20, 30);
    ctx.fillText(timestamp, 20, 30);

    const ext = path.extname(file.name) || '.png';
    const newFileName = `${randomUUID()}${ext}`;
    const githubFilePath = `${GITHUB_FOLDER_PATH}/${type}/${newFileName}`;

    const encodedContent = canvas.toBuffer().toString('base64');

    const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${githubFilePath}`;

    const uploadResponse = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: `Upload ${type} image: ${newFileName}`,
        content: encodedContent,
        branch: GITHUB_BRANCH,
      }),
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { error: uploadResult.message || 'GitHub upload failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName: newFileName,
      githubUrl: uploadResult.content.html_url,
      rawUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubFilePath}`,
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
