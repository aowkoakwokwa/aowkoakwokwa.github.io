'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import { Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { signIn, getSession } from 'next-auth/react';

const Android12Switch = styled(Switch)(({ theme }) => ({
  padding: 8,
  '& .MuiSwitch-track': {
    borderRadius: 22 / 2,
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 16,
      height: 16,
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: 'none',
    width: 16,
    height: 16,
    margin: 2,
  },
}));

type User = {
  id: string;
  username: string;
  user_level: string;
  hak_akses: string;
};

export default function Home() {
  const { enqueueSnackbar } = useSnackbar();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    const savedPassword = localStorage.getItem('password');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedRememberMe === 'true') {
      setUsername(savedUsername || '');
      setPassword(savedPassword || '');
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.ok) {
      try {
        const userRes = await fetch('/api/get-user');
        const data: User = await userRes.json();
        setUserData(data);

        if (data.user_level === 'Admin') {
          router.push('/dashboard');
        } else if (data.user_level === 'User' && data.hak_akses === 'NCR') {
          router.push('/ncr/entry-ncr');
        } else if (data.hak_akses === 'Kalibrasi') {
          router.push('/master-kalibrasi');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to get user:', error);
        enqueueSnackbar('Gagal mengambil data user.', { variant: 'error' });
      }
    } else {
      enqueueSnackbar('Login gagal. Periksa username dan password.', { variant: 'error' });
    }

    setLoading(false);

    if (rememberMe) {
      localStorage.setItem('username', username);
      localStorage.setItem('password', password);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('password');
      localStorage.removeItem('rememberMe');
    }
  };

  return (
    <div
      className="w-full flex justify-center items-center px-4 md:px-0 text-black"
      style={{ height: 'calc(var(--vh, 1vh) * 100)', background: '#f6f7f9' }}
    >
      <div className="absolute top-0 left-0 right-0 w-full h-[450px] hidden lg:block">
        <div className="relative w-full h-full p-3">
          <div className="relative w-full h-full">
            <Image src="/images/bg.jpeg" alt="Login" fill className="object-cover rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 justify-center items-center z-10 rounded-xl bg-white p-2 lg:shadow-lg w-full max-w-lg lg:max-w-4xl">
        <picture className="flex justify-center items-center w-full mb-4 lg:mb-0">
          <source media="(max-width: 1024px)" />
          <Image
            src="/images/logo.png"
            alt="Login"
            width={250}
            height={250}
            className="hidden lg:block max-w-none h-auto drop-shadow-2xl"
          />
          <img
            src="/images/logo-flat.png"
            alt="Logo Flat"
            className="lg:hidden w-full max-w-[300px] h-auto"
          />
        </picture>

        <div className="p-5 lg:p-10 md:p-[4.5rem]">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-center lg:text-left">
              Welcome Back 👋
            </h2>
            <h6 className="w-full md:w-[350px] mt-2.5 text-center lg:text-left text-sm md:text-base">
              Selamat datang di sistem Kalibrasi & NCR. Masuk untuk mulai bekerja.
            </h6>
          </div>

          <div className="mt-5">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <label htmlFor="username" className="mb-2 text-sm md:text-base">
                  Username
                </label>
                <input
                  className="w-full md:w-[350px] rounded-xl bg-[#f7faff] border border-[#d4d7e0] p-2 mt-1 placeholder:text-[#8997ab] text-black focus-within:outline-none mb-4 text-sm md:text-base"
                  type="text"
                  autoComplete="off"
                  id="username"
                  name="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="password" className="text-sm md:text-base">
                  Password
                </label>
                <input
                  className="w-full md:w-[350px] rounded-xl bg-[#f7faff] border border-[#d4d7e0] p-2 mt-1 placeholder:text-[#8997ab] text-black focus-within:outline-none text-sm md:text-base"
                  type="password"
                  autoComplete="off"
                  id="password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="w-full md:w-[350px] flex justify-end items-center my-3 text-sm md:text-base">
                <label className="mr-2">Remember Me</label>
                <Android12Switch
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                sx={{
                  width: '100%',
                  maxWidth: '350px',
                  display: 'block',
                  textAlign: 'center',
                  borderRadius: '12px',
                  backgroundColor: '#162e3a',
                  border: '1px solid #162e3a',
                  padding: '6px',
                  marginTop: '4px',
                  color: '#fff',
                  fontSize: { xs: '14px', md: '16px' },
                  '&:focus-within': { outline: 'none' },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
