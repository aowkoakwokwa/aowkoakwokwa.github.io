'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import * as jwtDecodeLib from 'jwt-decode';

import { CardContent } from '@mui/joy';
import Card from '@mui/joy/Card';

import ChartDataFile from './chartDataFile';
import LaporanTerbaru from './laporanTerbaru';
import LaporanExpired from './laporanExpired';
import LaporanTerbaruNcr from './laporanTerbaruNcr';
import { useUserStore } from '../../../store/store';

export default function Dashboard() {
  const [mode, setMode] = useState<'periode' | 'tahun'>('periode');
  const userLevel = useUserStore((state) => state.userLevel);
  const userAccess = useUserStore((state) => state.userHakAkses);

  return (
    <main className="flex-1">
      <Card className="mb-7 p-4">
        <CardContent>
          <h2 className="text-lg font-semibold">Laporan Degrees Usage</h2>
          <div className="mt-3 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="report"
                className="accent-blue-600"
                value="periode"
                checked={mode === 'periode'}
                onChange={() => setMode('periode')}
              />
              Periode
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="report"
                className="accent-blue-600"
                value="tahun"
                checked={mode === 'tahun'}
                onChange={() => setMode('tahun')}
              />
              Per Tahun
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="mt-2 w-[99.9%] h-[300px]">
        <ChartDataFile mode={mode} />
      </div>

      {userLevel === 'Admin' && userAccess === 'Semua' && (
        <div className="flex gap-6 mt-2">
          <div className="w-full">
            <LaporanTerbaru />
          </div>
          <div className="w-full">
            <LaporanTerbaruNcr />
          </div>
        </div>
      )}

      {userLevel === 'Admin' && userAccess === 'Kalibrasi' && (
        <div className="flex gap-6 mt-2">
          <div className="w-full">
            <LaporanTerbaru />
          </div>
          <div className="w-full">
            <LaporanExpired />
          </div>
        </div>
      )}

      {userLevel === 'Admin' && userAccess === 'NCR' && (
        <div className="flex mt-2">
          <div className="w-full">
            <LaporanTerbaruNcr />
          </div>
        </div>
      )}
    </main>
  );
}
