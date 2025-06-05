import BreadcrumbsUrl from '@/components/breadcrumbs';
import Sidebar from '@/components/sidebar';
import React from 'react';

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-screen">
      <Sidebar />

      <div className="z-10 py-5 pr-5 max-w-[85%] w-full flex flex-col h-screen">
        <BreadcrumbsUrl />

        <div className="w-full flex-1 pt-6">{children}</div>
      </div>
    </div>
  );
}

export default layout;
