'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePageStore } from '@/../store/store';

export default function ZustandInitializer() {
  const setCurrentPage = usePageStore((state) => state.setCurrentPage);
  const pathname = usePathname(); // path saat ini, update otomatis

  useEffect(() => {
    if (!pathname) return;

    setCurrentPage(pathname);

    // Simpan ke cookie
    document.cookie = `currentPage=${encodeURIComponent(pathname)}; path=/`;
  }, [pathname, setCurrentPage]);

  return null;
}
