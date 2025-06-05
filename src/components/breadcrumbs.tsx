'use client';

import Breadcrumbs from '@mui/joy/Breadcrumbs';
import Typography from '@mui/material/Typography';
import { useUserStore, useWebStore } from '../../store/store';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import { Menu, MenuItem, IconButton } from '@mui/material';
import { Avatar } from '@mui/joy';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import UserAccount from '@/app/userAccount';
import { signOut } from 'next-auth/react';

export default function BreadcrumbsUrl() {
  const setControl = useWebStore((state) => state.setControl);
  const control = useWebStore((state) => state.control);
  const pathname = usePathname() ?? '';
  const pathnames = pathname ? pathname.split('/').filter((v) => v) : [];
  const [openAccount, setOpenAccount] = useState(false);
  const [urlImage, setUrlImage] = useState('');
  const userLevel = useUserStore((state) => state.userLevel);
  const userHakAccess = useUserStore((state) => state.userHakAkses);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const capitalizeWords = (text: string) => {
    return text
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="flex items-center justify-between bg-white shadow-md rounded-xl px-4 p-2">
      <div className="flex items-center gap-x-4">
        <div className="text-gray-800">
          <Breadcrumbs sx={{ p: 0, color: 'black' }} separator="/" aria-label="breadcrumb">
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const displayValue = capitalizeWords(value);

              return last ? (
                <Typography key={to} color="black">
                  {displayValue}
                </Typography>
              ) : (
                <Link key={to} href={to}>
                  <Typography color="black" className="opacity-80">
                    {displayValue}
                  </Typography>
                </Link>
              );
            })}
          </Breadcrumbs>

          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const displayValue = capitalizeWords(value);

            return last ? (
              <h1 key={value} className="font-semibold">
                <Typography color="black" sx={{ fontWeight: 600 }}>
                  {displayValue}
                </Typography>
              </h1>
            ) : null;
          })}
        </div>
        <button onClick={() => setControl()} className="text-black h-full flex justify-center">
          {control ? <MenuOutlinedIcon /> : <SortOutlinedIcon />}
        </button>
      </div>

      <div className="relative">
        <IconButton onClick={handleClick}>
          <Avatar src={urlImage} variant="outlined" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {userHakAccess === 'Semua' && userLevel === 'Admin' && (
            <MenuItem onClick={() => setOpenAccount(true)}>User Account</MenuItem>
          )}
          <MenuItem onClick={() => signOut({ callbackUrl: '/' })}>Logout</MenuItem>
        </Menu>

        <UserAccount open={openAccount} close={() => setOpenAccount(false)} />
      </div>
    </div>
  );
}
