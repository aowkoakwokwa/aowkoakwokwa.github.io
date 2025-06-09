'use client';

import { getCardek } from '@/lib/getData';
import { Input } from '@mui/joy';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { Controller, useForm } from 'react-hook-form';

export default function CardekModal({
  open,
  close,
  rept,
  data,
  onDataSubmit,
}: {
  open: boolean;
  close: () => void;
  rept: string;
  data: string;
  onDataSubmit: (data: any) => void;
}) {
  const jft_no = data[1];

  const { data: reptNoData } = useQuery({
    queryKey: ['getReptNo', jft_no],
    queryFn: async () => {
      const allData = await getCardek();
      return allData.find((item: any) => item.jft_no === jft_no)?.rept_no || null;
    },
    enabled: !!jft_no,
    refetchOnWindowFocus: false,
  });

  const form = useForm({
    defaultValues: {
      rept_no: rept || '',
      sert_no: '-',
      cal_location: 'PT. SAGATRADE MURNI',
      cal_name: 'RUDI HASTOMO',
    },
  });

  const resetForm = useCallback(() => {
    const newReptNo = rept || reptNoData || '';
    if (form.getValues('rept_no') !== newReptNo) {
      form.reset({
        rept_no: newReptNo,
        sert_no: '-',
        cal_location: 'PT. SAGATRADE MURNI',
        cal_name: 'RUDI HASTOMO',
      });
    }
  }, [form, rept, reptNoData]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, reptNoData, resetForm]);

  const [debouncedRept] = useDebounce(form.watch('rept_no'), 300);

  const stableOnDataSubmit = useCallback(onDataSubmit, []);

  useEffect(() => {
    stableOnDataSubmit(form.watch());
  }, [debouncedRept, stableOnDataSubmit]);

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Cardek Input</DialogTitle>
      <DialogContent>
        <div className="mb-4">
          <label className="block font-medium mb-1">Rept No.</label>
          <Controller
            control={form.control}
            name="rept_no"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none uppercase"
                placeholder="Rept No."
              />
            )}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Cert No.</label>
          <Controller
            control={form.control}
            name="sert_no"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none uppercase"
                placeholder="Type something.."
              />
            )}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Cal. Location</label>
          <Controller
            control={form.control}
            name="cal_location"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none uppercase"
                placeholder="Type something.."
              />
            )}
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Name</label>
          <Controller
            control={form.control}
            name="cal_name"
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none uppercase"
                placeholder="Type something.."
              />
            )}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
