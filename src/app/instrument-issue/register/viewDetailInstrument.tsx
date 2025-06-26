'use client';

import { Button, Input } from '@mui/joy';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { getInstrumentData } from '@/lib/getData';
import { useCheckedInstrumentStore, useInstrumentStore } from '../../../../store/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import InstrumentListTable from './instrumentListTable';
import { editReturnData } from '@/lib/editData';
import { CircularProgress } from '@mui/joy';
import OperatorForm from './operatorForm';
import InstrumentListTableDetail from './instrumentListTableDetail';

export default function ViewDetailInstrument({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const { selectedItem, setSelectedItem, resetSelectedItem } = useInstrumentStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const checkedMap = useCheckedInstrumentStore((state) => state.checkedInstrumentMap);
  const [payrollId, setPayrollId] = useState('');
  const [payrollName, setPayrollName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = sessionStorage.getItem('payroll_id') || '';
      const name = sessionStorage.getItem('payroll_name') || '';
      setPayrollId(id);
      setPayrollName(name);
    }
  }, []);
  const returnBy = `${payrollId} - ${payrollName}` || '';

  useEffect(() => {
    setIsCameraActive(true);
    if (!canvasRef.current) {
      return;
    }

    setTimeout(() => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error('Gagal mengakses kamera:', err));
    }, 500);
  });

  const captureImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !videoRef.current.srcObject) {
        reject('Kamera tidak tersedia atau belum siap.');
        return;
      }

      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];

      if (!track || !track.enabled) {
        reject('Track video tidak aktif.');
        return;
      }

      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);

          canvasRef.current.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject('Gagal menangkap gambar');
          }, 'image/png');
        } else {
          reject('Konteks canvas tidak ditemukan');
        }
      } else {
        reject('Canvas tidak tersedia');
      }
    });
  };

  const { data = [] } = useQuery({
    queryKey: ['getInstrumentData'],
    queryFn: getInstrumentData,
    refetchOnWindowFocus: false,
  });

  const selectedInstrument = data.find((item: any) => item.usage_no === selectedItem?.usage_no);

  const form = useForm({
    defaultValues: {
      usage_no: selectedInstrument?.usage_no || '',
      est_return_date: selectedInstrument?.est_return_date || '',
      wo_refer_to: selectedInstrument?.wo_refer_to || '',
      location: selectedInstrument?.location || '',
      tgl_kembali: selectedInstrument?.tgl_kembali || '',
      nama: selectedInstrument?.nama || '',
      batch_qty: selectedInstrument?.batch_qty || '',
      departement: selectedInstrument?.dept || '',
      tgl_diterima: selectedInstrument?.tgl_diterima
        ? new Date(selectedInstrument.tgl_diterima).toISOString().slice(0, 10)
        : '',
    },
  });

  const operator = selectedInstrument?.no_payroll + ' - ' + selectedInstrument?.nama || '';

  useEffect(() => {
    if (selectedInstrument) {
      form.reset({
        usage_no: selectedInstrument.usage_no ?? '',
        est_return_date: selectedInstrument.est_return_date ?? '',
        wo_refer_to: selectedInstrument.wo_refer_to ?? '',
        location: selectedInstrument.location ?? '',
        tgl_kembali: selectedInstrument.tgl_kembali ?? '',
        nama: operator ?? '',
        batch_qty: selectedInstrument.batch_qty ?? '',
        departement: selectedInstrument.dept ?? '',
        tgl_diterima: selectedInstrument.tgl_diterima
          ? new Date(selectedInstrument.tgl_diterima).toISOString().slice(0, 10)
          : '',
      });
    }
  }, [selectedInstrument, form]);

  const handleClose = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    resetSelectedItem();
    sessionStorage.removeItem('payroll_id');
    sessionStorage.removeItem('payroll_name');
    sessionStorage.removeItem('departement');
    localStorage.removeItem('payroll-storage');
    close();
  };

  const formatDateToInputValue = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  function formatToDateTimeLocal(value: string | Date): string {
    const date = new Date(value);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  useEffect(() => {
    if (!open) return;

    const updateTime = () => {
      const now = new Date();
      const formatted = formatDateToInputValue(now);
      setCurrentDateTime(formatted);
      form.setValue('tgl_kembali', formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            close();
          }
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Detail Instrument</DialogTitle>
        <DialogContent sx={{ overflow: 'hidden' }}>
          <div className="grid grid-cols-2 gap4 overflow-x-hidden">
            <div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Usage No</label>
                <Controller
                  control={form.control}
                  name="usage_no"
                  render={({ field }) => (
                    <Input
                      required
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="Type something.."
                      readOnly
                    />
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Name / Operator</label>
                <Controller
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <Input
                      required
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="Type something.."
                      readOnly
                    />
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Department</label>
                <Controller
                  control={form.control}
                  name="departement"
                  render={({ field }) => (
                    <Input
                      required
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="Type something.."
                      readOnly
                    />
                  )}
                />
              </div>
            </div>
            <div className="mx-6">
              <div className="flex gap-6">
                <label className="block font-medium mb-1 w-full">Issued Date</label>
                <label className="block font-medium mb-1 w-full">Est Return Date</label>
              </div>
              <div className="mb-4 flex gap-4">
                <Controller
                  control={form.control}
                  name="tgl_diterima"
                  render={({ field }) => (
                    <Input
                      required
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="YYYY-MM-DD"
                      readOnly
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="est_return_date"
                  render={({ field }) => (
                    <Input
                      required
                      value={
                        typeof field.value === 'string'
                          ? formatToDateTimeLocal(field.value)
                          : field.value instanceof Date
                            ? formatToDateTimeLocal(field.value)
                            : ''
                      }
                      onChange={field.onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="Type something.."
                      readOnly
                    />
                  )}
                />
                <div className="hidden">
                  <Controller
                    control={form.control}
                    name="tgl_kembali"
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                        value={field.value || ''}
                        readOnly
                      />
                    )}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Ref. WO/Special Note</label>
                <Controller
                  control={form.control}
                  name="wo_refer_to"
                  render={({ field }) => (
                    <Input
                      required
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="Type something.."
                      readOnly
                    />
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Batch Qty</label>
                <Controller
                  control={form.control}
                  name="batch_qty"
                  render={({ field }) => (
                    <Input
                      required
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="Type something.."
                      readOnly
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div>
            <InstrumentListTableDetail />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
