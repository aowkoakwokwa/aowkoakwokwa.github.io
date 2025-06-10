'use client';

import { useSearchParams } from 'next/navigation';

export default function PdfPreview() {
  const searchParams = useSearchParams();
  const file = searchParams.get('file');

  if (!file) {
    return <p>Tidak ada file PDF yang diminta.</p>;
  }

  return (
    <iframe src={file} width="100%" height="100vh" style={{ border: 'none' }} title="PDF Preview" />
  );
}
