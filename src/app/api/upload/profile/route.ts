import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import Busboy from 'busboy';
import { Readable } from 'stream';

interface BusboyFileInfo {
  filename: string;
  encoding?: string;
  mimeType?: string;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // console.log('📩 Menerima request upload...');

  const headers = Object.fromEntries(req.headers.entries());
  const bb = Busboy({ headers });

  const uploadDir = path.join(process.cwd(), 'public/images/profile');
  await mkdir(uploadDir, { recursive: true });

  let fileName = '';
  const fileWritePromises: Promise<void>[] = [];

  return new Promise<NextResponse>(async (resolve, reject) => {
    bb.on('file', (_fieldname: string, file: Readable, fileInfo: BusboyFileInfo) => {
      // console.log('📩 fileInfo:', fileInfo);

      if (!fileInfo || typeof fileInfo !== 'object' || !fileInfo.filename) {
        // console.error('❌ Filename tidak valid:', fileInfo);
        return;
      }

      fileName = String(fileInfo.filename);
      // console.log('📁 Menyimpan file:', fileName);

      const saveTo = path.join(uploadDir, fileName);
      // console.log('📂 Path penyimpanan:', saveTo);

      const fileBuffer: Buffer[] = [];

      file.on('data', (chunk) => fileBuffer.push(chunk));

      const filePromise = new Promise<void>((res, rej) => {
        file.on('end', async () => {
          try {
            await writeFile(saveTo, Buffer.concat(fileBuffer));
            // console.log('✅ Upload selesai:', fileName);
            res();
          } catch (err) {
            // console.error('❌ Gagal menyimpan file:', err);
            rej(err);
          }
        });
      });

      fileWritePromises.push(filePromise);
    });

    bb.on('finish', () => {
      (async () => {
        try {
          await Promise.all(fileWritePromises);
          const imageUrl = `/images/profile/${fileName}`;
          resolve(
            NextResponse.json(
              {
                message: 'File uploaded successfully',
                fileName,
                url: imageUrl, // ✅ Tambahkan URL
              },
              { status: 200 },
            ),
          );
        } catch (err) {
          reject(
            NextResponse.json(
              {
                error: 'Upload failed',
                details: (err as Error).message,
              },
              { status: 500 },
            ),
          );
        }
      })();
    });

    bb.on('error', (err: Error) => {
      // console.error('❌ Upload gagal:', err);
      reject(NextResponse.json({ error: 'Upload failed', details: err.message }, { status: 500 }));
    });

    const stream = new Readable();
    stream.push(req.body ? Buffer.from(await req.arrayBuffer()) : null);
    stream.push(null);
    stream.pipe(bb);
  });
}
