'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ListItemButton } from '@mui/material';
import { ListItemDecorator, ListItemContent, List, ListItem } from '@mui/joy';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUserStore, useWebStore, useWebStoreInstrument } from '../../store/store';
import LaporanNcr from '@/app/ncr/laporaNcr';
import { useIdleTimer } from 'react-idle-timer';
import { signOut } from 'next-auth/react';
import {
  ChevronDown,
  FileText,
  FlaskConical,
  FlaskConicalOff,
  LayoutDashboard,
  Package2,
} from 'lucide-react';
import LaporanInstrument from '@/app/instrument-issue/laporan/laporanInstrument';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openInstrument, setOpenInstrument] = useState(false);
  const control = useWebStore((state) => state.control);
  const controlInstrument = useWebStoreInstrument((state) => state.control);
  const [openLaporan, setOpenLaporan] = useState(false);
  const [openLaporanInstrument, setOpenLaporanInstrument] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUserData } = useUserStore();
  const userLevel = useUserStore((state) => state.userLevel);
  const userAccess = useUserStore((state) => state.userHakAkses);

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch('/api/get-user');
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error('Failed to get user:', error);
      }
    }
    getUser();
  }, [setUserData]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleClick = () => {
    setOpen(!open);
  };

  const handleClickInstrument = () => {
    setOpenInstrument(!openInstrument);
  };

  const handleOnIdle = () => {
    signOut({ callbackUrl: '/' });
  };

  const idleTimer = useIdleTimer({
    timeout: 60 * 10000,
    onIdle: handleOnIdle,
    crossTab: true,
    throttle: 500,
  });

  return (
    <>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <motion.div
        className="p-5 h-screen bg-transparent z-10"
        animate={{ width: control ? '160px' : '330px' }}
        transition={{ duration: 0.1, ease: 'easeInOut' }}
      >
        <div className="bg-white h-full rounded-xl flex flex-col justify-between px-4 shadow-md">
          <div className="flex-row justify-center items-center w-full mb-4 lg:mb-0">
            <div className="px-4 border-b border-[#c2c5ca] py-4">
              {!control ? (
                <img
                  src="/images/logo-flat.png"
                  alt="Logo Flat"
                  className="w-full max-w-[250px] h-[75px] object-cover"
                />
              ) : (
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="w-full max-w-[45px] h-auto py-4"
                />
              )}
            </div>
            <List>
              <div>
                {userLevel === 'Admin' && userAccess !== 'Instrument' && (
                  <ListItem sx={{ p: 0 }}>
                    <ListItemButton>
                      <ListItemDecorator className={control ? 'flex justify-center' : ''}>
                        <LayoutDashboard color="#f75252" />
                      </ListItemDecorator>
                      {!control && (
                        <ListItemContent className="font-medium">
                          <Link href="/dashboard">Dashboard</Link>
                        </ListItemContent>
                      )}
                    </ListItemButton>
                  </ListItem>
                )}
                {(userAccess === 'NCR' || userAccess === 'Semua') && (
                  <>
                    <ListItem sx={{ p: 0 }}>
                      <ListItemButton onClick={handleClick}>
                        <ListItemDecorator className={control ? 'flex justify-center' : ''}>
                          <FileText color="#f75252" />
                        </ListItemDecorator>
                        {!control && <ListItemContent className="font-medium">NCR</ListItemContent>}
                        {!control && (
                          <motion.div
                            initial={false}
                            animate={{ rotate: open ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown color="#f75252" />
                          </motion.div>
                        )}
                      </ListItemButton>
                    </ListItem>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: open ? '90px' : 0, opacity: open ? 1 : 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {open && (
                        <List component="div" sx={{ p: 0 }}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemButton selected={pathname === '/ncr/entry-ncr'}>
                              <ListItemContent className="px-8">
                                <Link href="/ncr/entry-ncr">Entry NCR</Link>
                              </ListItemContent>
                            </ListItemButton>
                          </ListItem>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemButton selected={pathname === '/ncr/laporan-ncr'}>
                              <ListItemContent
                                className="px-8"
                                onClick={() => setOpenLaporan(true)}
                              >
                                Laporan NCR
                              </ListItemContent>
                            </ListItemButton>
                          </ListItem>
                        </List>
                      )}
                    </motion.div>
                  </>
                )}
                {(userAccess === 'Kalibrasi' || userAccess === 'Semua') && (
                  <>
                    <ListItem sx={{ p: 0 }}>
                      <ListItemButton>
                        <ListItemDecorator className={control ? 'flex justify-center' : ''}>
                          <FlaskConical color="#f75252" />
                        </ListItemDecorator>
                        {!control && (
                          <ListItemContent className="font-medium">
                            <Link href="/master-kalibrasi">Master Kalibrasi</Link>
                          </ListItemContent>
                        )}
                      </ListItemButton>
                    </ListItem>
                  </>
                )}
                {(userAccess === 'Kalibrasi' || userAccess === 'Semua') && (
                  <>
                    <ListItem sx={{ p: 0 }}>
                      <ListItemButton>
                        <ListItemDecorator className={control ? 'flex justify-center' : ''}>
                          <FlaskConicalOff color="#f75252" />
                        </ListItemDecorator>
                        {!control && (
                          <ListItemContent className="font-medium">
                            <Link href="/master-non-kalibrasi">Master Non Kalibrasi</Link>
                          </ListItemContent>
                        )}
                      </ListItemButton>
                    </ListItem>
                  </>
                )}
                {(userAccess === 'Semua' ||
                  userAccess === 'Kalibrasi' ||
                  userAccess === 'Instrument') && (
                  <>
                    <ListItem sx={{ p: 0 }}>
                      <ListItemButton onClick={handleClickInstrument}>
                        <ListItemDecorator
                          className={controlInstrument ? 'flex justify-center' : ''}
                        >
                          <Package2 color="#f75252" />
                        </ListItemDecorator>
                        {!controlInstrument && (
                          <ListItemContent className="font-medium">
                            Instrument Issue
                          </ListItemContent>
                        )}
                        {!controlInstrument && (
                          <motion.div
                            initial={false}
                            animate={{ rotate: openInstrument ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown color="#f75252" />
                          </motion.div>
                        )}
                      </ListItemButton>
                    </ListItem>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: openInstrument ? '90px' : 0,
                        opacity: openInstrument ? 1 : 0,
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {openInstrument && (
                        <List component="div" sx={{ p: 0 }}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemButton selected={pathname === '/instrument-issue/register'}>
                              <ListItemContent className="px-8">
                                <Link href="/instrument-issue/register">Register</Link>
                              </ListItemContent>
                            </ListItemButton>
                          </ListItem>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemButton selected={pathname === '/instrument-issue/laporan'}>
                              <ListItemContent
                                className="px-8"
                                onClick={() => setOpenLaporanInstrument(true)}
                              >
                                Laporan
                              </ListItemContent>
                            </ListItemButton>
                          </ListItem>
                        </List>
                      )}
                    </motion.div>
                  </>
                )}
              </div>
            </List>
          </div>
          <RealTimeClock />
        </div>
      </motion.div>
      <LaporanInstrument
        open={openLaporanInstrument}
        close={() => setOpenLaporanInstrument(false)}
      />
      <LaporanNcr open={openLaporan} close={() => setOpenLaporan(false)} />
    </>
  );
}

const RealTimeClock = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border-t border-[#c2c5ca]">
      <p className="text-sm text-gray-600">{currentTime || 'Loading...'}</p>
    </div>
  );
};
