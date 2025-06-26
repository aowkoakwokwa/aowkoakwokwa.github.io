'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
} from '@mui/material';
import { Button, Checkbox, Input, Table } from '@mui/joy';
import { useEffect, useState } from 'react';
import { CircleX, Trash2, Users } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCardekFile } from '@/lib/getData';
import { insertManualCardek } from '@/lib/insertData';
import { AddCircleOutline } from '@mui/icons-material';
import { useSelectionStore, useUserStore } from '../../../store/store';
import { Controller, useForm } from 'react-hook-form';
import { deleteManualCardek } from '@/lib/deleteData';

export default function ManualCardek({ open, close }: { open: boolean; close: () => void }) {
  const form = useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [jftNo, setJftNo] = useState('');
  const [debouncedJftNo, setDebouncedJftNo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { selectedRows, setSelectedRows, clearSelectedRows } = useSelectionStore();
  const userData = useUserStore((state) => state.userData);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const masterData = useQuery({
    queryKey: ['cardekFile'],
    queryFn: getCardekFile,
    refetchOnWindowFocus: false,
  });

  const jft_no = (selectedRows as any[])?.[1] ?? '';
  const filteredData = masterData.data?.filter((row) => row.jft_no === jft_no) || [];

  const addManualMutation = useMutation({
    mutationFn: insertManualCardek,
    onSuccess: () => {
      masterData.refetch();
      setSelectedFile(null);
      setSelectedId(null);
      setJftNo('');
      close();
    },
    onError: (error) => {
      console.error('Gagal menambahkan data:', error);
      alert('Terjadi kesalahan saat menambahkan data.');
    },
  });

  const handleDelete = () => {
    if (selectedId != null) {
      deleteMutation.mutate(selectedId);
      setConfirmOpen(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedJftNo(jftNo);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [jftNo]);

  const onSubmit = async () => {
    let lampiranPath = '';
    if (selectedFile) {
      const formDataUpload = new FormData();
      formDataUpload.append('lampiran', selectedFile);
      formDataUpload.append('no_jft', jft_no);
      const uploadResponse = await fetch('/api/upload/kalibrasi', {
        method: 'POST',
        body: formDataUpload,
      });
      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
      }
      const fileData = await uploadResponse.json();
      lampiranPath = `https://aowkoakwokwa.github.io/public/lampiran/kalibrasi/${fileData.fileName}`;
    }

    const updateData = {
      jft_no: jft_no,
      file: lampiranPath,
    };

    addManualMutation.mutate(updateData);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteManualCardek,
    onSuccess: () => {
      masterData.refetch();
      setSelectedId(null);
    },
    onError: (error) => {
      console.error('Gagal menghapus data:', error);
      alert('Terjadi kesalahan saat menghapus data.');
    },
  });

  if (masterData.isLoading) return <p>Loading...</p>;
  if (masterData.isError) return <p>Error loading data</p>;

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTitle>Manual Cardek</DialogTitle>
          <DialogContent>
            <div className="mb-4">
              <label className="block font-medium mb-1">Jft No</label>
              <Controller
                control={form.control}
                name="no_jft"
                render={({ field }) => (
                  <Input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Type anything.."
                    {...field}
                    value={jft_no ?? ''}
                    disabled
                  />
                )}
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Lampiran</label>
              <div className="flex gap-2">
                <Input
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Pilih file..."
                  value={selectedFile ? selectedFile.name : ''}
                  disabled
                />
                <Button variant="solid" component="label">
                  Upload
                  <input
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                </Button>
              </div>
            </div>
            <Table aria-label="Subitem Table">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>No JFT</TableCell>
                  <TableCell>Lampiran</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.id_cardek_file}>
                    <TableCell>
                      <Checkbox
                        checked={selectedId === row.id_cardek_file}
                        onChange={() =>
                          setSelectedId(
                            selectedId === row.id_cardek_file ? null : row.id_cardek_file,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>{row.jft_no}</TableCell>
                    <TableCell>
                      <a className="text-blue-500 underline" href={row.file} target="_blank">
                        Lihat
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 15]}
              component="div"
              count={filteredData.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              startDecorator={<AddCircleOutline />}
              disabled={!selectedFile || !jft_no || addManualMutation.isPending}
              color="success"
              type="submit"
            >
              Add
            </Button>

            <Button startDecorator={<CircleX />} color="danger" onClick={close}>
              Cancel
            </Button>
            {selectedId != null && (
              <Button
                startDecorator={<Trash2 />}
                color="danger"
                onClick={() => setConfirmOpen(true)}
              >
                Delete
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <p>Apakah kamu yakin ingin menghapus data ini?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="neutral">
            Batal
          </Button>
          <Button onClick={handleDelete} color="danger">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
