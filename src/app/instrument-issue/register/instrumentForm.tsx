'use client';

import { Button, Input } from '@mui/joy';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Controller, set, useForm } from 'react-hook-form';
import PickInstrument from './pickInstrument';
import { useScannedStore } from '../../../../store/store';
import { CircularProgress } from '@mui/joy';
import { useMutation } from '@tanstack/react-query';
import DateTimePicker from './customDateTime';
import { insertDataInstrument } from '@/lib/insertData';
import { insertDetailPeminjaman } from '@/lib/insertData';
import OperatorForm from './operatorForm';

export default function InstrumentForm({
  open,
  close,
  onSuccess,
}: {
  open: boolean;
  close: () => void;
  onSuccess: () => void;
}) {
  const form = useForm();
  const [openList, setOpenList] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { scannedData, clearScannedData } = useScannedStore();
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [usageNo, setUsageNo] = useState<string>(() => `P${dayjs().format('YYMMDDHHmmss')}`);
  const [currentDateTime, setCurrentDateTime] = useState<string>(
    dayjs().format('MM/DD/YYYY HH:mm:ss'),
  );
  const [payrollId, setPayrollId] = useState('');
  const [payrollName, setPayrollName] = useState('');
  const [payrollDepartement, setPayrollDepartement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const id = sessionStorage.getItem('payroll_id');
      const name = sessionStorage.getItem('payroll_name');
      const dept = sessionStorage.getItem('departement');
      setPayrollId(id || '');
      setPayrollName(name || '');
      setPayrollDepartement(dept || '');
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    form.setValue('usage_no', usageNo);
  }, [form, usageNo]);

  useEffect(() => {
    if (openList) {
      setIsCameraActive(false);
    } else {
      setTimeout(() => {
        setIsCameraActive(true);
      }, 100);
    }
  }, [openList]);

  useEffect(() => {
    if (!openList && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      if (!canvasRef.current) return;

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
    } else {
      console.warn('navigator.mediaDevices.getUserMedia tidak tersedia.');
    }
  }, [openList]);

  useEffect(() => {
    form.setValue('payroll_id', payrollId ?? '');
    form.setValue('payroll_name', payrollName ?? '');
    form.setValue('dept', payrollDepartement ?? '');
  }, [form, payrollId, payrollName, payrollDepartement]);

  useEffect(() => {
    const interval = setInterval(() => {
      const formattedDateTime = dayjs().format('MM/DD/YYYY HH:mm:ss');

      setCurrentDateTime(formattedDateTime);
      form.setValue('issued_date', formattedDateTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [form]);

  const handleClose = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    clearScannedData();

    form.reset();

    const newUsageNo = `P${dayjs().format('YYMMDDHHmmss')}`;
    setUsageNo(newUsageNo);
    form.setValue('usage_no', newUsageNo);
  };

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

  const uploadImage = async (imageBlob: Blob, type: 'issued' | 'return'): Promise<string> => {
    const formData = new FormData();
    formData.append('lampiran', imageBlob, `instrument_${Date.now()}.png`);
    formData.append('type', type);

    const response = await fetch('/api/upload/instrumentImage', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload gagal');

    const lampiranPath = `https://aowkoakwokwa.github.io/public/images/instrument/issued/${data.fileName}`;

    return lampiranPath;
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { mainData, detailData } = data;
      const response = await insertDataInstrument(mainData);

      if (response?.usage_no) {
        await insertDetailPeminjaman(response.usage_no, detailData);
      }

      return response;
    },
    onSuccess: () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
      }

      sessionStorage.removeItem('payroll_id');
      sessionStorage.removeItem('payroll_name');
      sessionStorage.removeItem('departement');

      clearScannedData();

      form.reset();

      const newUsageNo = `P${dayjs().format('YYMMDDHHmmss')}`;
      setUsageNo(newUsageNo);
      form.setValue('usage_no', newUsageNo);

      onSuccess();
      close();
    },

    onError: (error) => {
      alert('Gagal menyimpan data!');
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (!Array.isArray(scannedData) || scannedData.length === 0) {
        alert('Tidak ada data yang dipilih');
        return;
      }

      const imageBlob = await captureImage();
      const imageUrl = await uploadImage(imageBlob, 'issued');

      const mainData = {
        ...data,
        imageUrl,
      };

      console.log(mainData);

      const detailData = scannedData.map((item: any) => ({
        usage_no: data.usage_no,
        jft_no: item.no_jft ?? null,
      }));

      mutation.mutate({ mainData, detailData });
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.message || 'Terjadi kesalahan saat submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            close();
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Instrument Form</DialogTitle>
        <DialogContent>
          <div className="mb-4">
            <label className="block font-medium mb-1">Usage No</label>
            <Controller
              control={form.control}
              name="usage_no"
              render={({ field: { value, onChange } }) => (
                <Input
                  required
                  value={usageNo ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Type something.."
                  readOnly
                />
              )}
            />
          </div>
          <div className="mb-4">
            <div className="flex flex-col">
              <div className="flex flex-row gap-4">
                <label className="block font-medium mb-1 w-full">Issued Date</label>
                <label className="block font-medium mb-1 w-full">Est Return Date</label>
              </div>
              <div className="flex flex-row gap-4">
                <Controller
                  control={form.control}
                  name="issued_date"
                  render={({ field }) => (
                    <Input
                      required
                      value={currentDateTime}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="est_return_date"
                  render={({ field: { value, onChange } }) => (
                    <DateTimePicker onChange={(value) => onChange(value)} />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="hidden">
            <Input
              required
              value={payrollId ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
              placeholder="Type something.."
            />
            <Input
              required
              value={payrollName ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
              placeholder="Type something.."
            />
          </div>
          <OperatorForm form={form} />
          <div className="mb-4">
            <label className="block font-medium mb-1">Ref WO/Special Note</label>
            <Controller
              control={form.control}
              name="wo_refer_to"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Input
                  required
                  value={value ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Type something.."
                />
              )}
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Batch Qty</label>
            <Controller
              control={form.control}
              name="batch_qty"
              render={({ field: { value, onChange } }) => (
                <Input
                  type="number"
                  slotProps={{
                    input: {
                      min: 0,
                    },
                  }}
                  required
                  value={value ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Type something.."
                />
              )}
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Usage Location</label>
            <Controller
              control={form.control}
              name="location"
              render={({ field: { value, onChange } }) => (
                <Input
                  required
                  value={value ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Type something.."
                />
              )}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenList(true)} color="success">
            List Barang
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            color="primary"
            disabled={isSubmitting}
            startDecorator={isSubmitting ? <CircularProgress size="sm" variant="soft" /> : null}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>

          <Button
            onClick={() => {
              sessionStorage.removeItem('payroll_id');
              sessionStorage.removeItem('payroll_name');
              sessionStorage.removeItem('departement');
              sessionStorage.removeItem('scannedData');
              handleClose();
              close();
            }}
            color="danger"
          >
            Cancel
          </Button>
          {isCameraActive && (
            <video ref={videoRef} autoPlay className="w-[50px] h-[50px] hidden"></video>
          )}
          <canvas ref={canvasRef} style={{ width: '50px', height: '50px', display: 'none' }} />
        </DialogActions>
      </Dialog>
      <PickInstrument open={openList} close={() => setOpenList(false)} />
    </>
  );
}
