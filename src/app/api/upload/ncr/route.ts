import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO!;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_PATH = 'public/lampiran/ncr/';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('lampiran') as File;
  const filename = randomUUID() + '.pdf';

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentBase64 = buffer.toString('base64');

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}${filename}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      message: `Upload ${filename}`,
      content: contentBase64,
      branch: GITHUB_BRANCH,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.message || 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({
    message: 'File uploaded successfully',
    fileName: filename,
    url: data.content.download_url,
  });
}
