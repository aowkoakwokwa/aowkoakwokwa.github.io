'use client';

import { getLastBorrowStatus, getMaster, getNonMaster } from '@/lib/getData';
import { Input, Table, Autocomplete } from '@mui/joy';
import { Dialog, DialogContent, DialogTitle, styled, TablePagination } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { useScannedStore } from '../../../../store/store';
import { Trash2 } from 'lucide-react';

interface Instrument {
  id: string | number;
  no_jft: string | null;
  description: string | null;
  size: string | null;
  serial_number: string | null;
  next_calibration?: Date | null;
}

const StyledOption = styled('li')({
  cursor: 'pointer',
  padding: '4px 20px',
  '&:hover': {
    backgroundColor: '#EEEEEE',
    color: 'black',
  },
});

export default function PickInstrument({ open, close }: { open: boolean; close: () => void }) {
  const [selectedItem, setSelectedItem] = useState<Instrument | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { scannedData, addScannedItem, removeScannedItemByIndex } = useScannedStore();
  const [inputValue, setInputValue] = useState('');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const recentlyScannedId = useRef<string | null>(null);

  const { data: masterData = [] } = useQuery({
    queryKey: ['getMaster'],
    queryFn: getMaster,
    refetchOnWindowFocus: false,
  });

  const { data: nonKalibrasiData = [] } = useQuery({
    queryKey: ['getNonMaster'],
    queryFn: getNonMaster,
    refetchOnWindowFocus: false,
  });

  const allData: Instrument[] = [...masterData, ...nonKalibrasiData];

  const groupByKalibrasi = (item: Instrument) => {
    return item.next_calibration ? 'Kalibrasi' : 'Non-Kalibrasi';
  };

  const handleSelect = async (item: Instrument | null) => {
    if (!item) return;

    if (recentlyScannedId.current === String(item.id)) {
      return;
    }
    recentlyScannedId.current = String(item.id);
    setTimeout(() => {
      recentlyScannedId.current = null;
    }, 2000);

    if ('next_calibration' in item && item.next_calibration) {
      const today = new Date();
      const nextCalibration = new Date(item.next_calibration);
      const diffTime = nextCalibration.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alert('⚠️ Alat tidak dapat dipinjam karena sudah expired.');
        return;
      } else if (diffDays <= 7) {
        alert('⚠️ Alat tidak dapat dipinjam karena hampir expired.');
        return;
      }
    }

    try {
      const status = await getLastBorrowStatus(item.no_jft!);
      if (status && status.kembali === 'Tidak') {
        alert('⚠️ Alat masih dalam status dipinjam. Tidak bisa dipinjam lagi.');
        return;
      }

      const isAlreadyScanned = scannedData.some((d) => String(d.id) === String(item.id));

      if (!isAlreadyScanned) {
        addScannedItem(item);
        setSelectedItem(item);
      }
    } catch (err) {
      console.error('Gagal cek status peminjaman:', err);
      alert('❌ Gagal mengecek status peminjaman alat.');
    }
  };

  useEffect(() => {
    if (inputValue.trim() === '') return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const exactMatch = allData.find(
        (item) => item.no_jft?.toUpperCase().trim() === inputValue.toUpperCase().trim(),
      );
      if (exactMatch) {
        handleSelect(exactMatch);
      }
    }, 800);
  }, [inputValue]);

  const handleClose = () => {
    setSelectedItem(null);
    close();
  };

  const removeScannedItem = (index: number) => {
    removeScannedItemByIndex(index);
  };

  const paginatedData = scannedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>List Item</DialogTitle>
      <DialogContent>
        <div className="flex flex-row gap-5">
          <div className="w-full">
            <div className="flex flex-col">
              <div className="w-full mb-4">
                <label>Pilih JFT No.</label>
                <Autocomplete
                  options={allData}
                  getOptionLabel={(option) => option.no_jft ?? ''}
                  isOptionEqualToValue={(opt, val) => String(opt.id) === String(val.id)}
                  onChange={(_, value) => handleSelect(value)}
                  onInputChange={(_, value) => {
                    setInputValue(value);
                  }}
                  inputValue={inputValue}
                  value={selectedItem}
                  placeholder="Search JFT No."
                  groupBy={groupByKalibrasi}
                  slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                  renderOption={(props, option) => {
                    const { ownerState, ...rest } = props as any;
                    return (
                      <StyledOption {...rest} key={String(option.id)}>
                        {option.no_jft}
                      </StyledOption>
                    );
                  }}
                />
              </div>
              <div className="flex flex-row gap-4">
                <div className="mb-4 w-full">
                  <label>Serial Number</label>
                  <Input value={selectedItem?.serial_number ?? ''} readOnly />
                </div>
                <div className="mb-4 w-full">
                  <label>Size</label>
                  <Input value={selectedItem?.size ?? ''} readOnly />
                </div>
              </div>
              <div className="mb-4">
                <label>Description</label>
                <Input value={selectedItem?.description ?? ''} readOnly />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Table>
            <thead>
              <tr>
                <th>JFT No.</th>
                <th>Serial Number</th>
                <th>Description</th>
                <th>Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, i) => (
                  <tr key={String(item.id)}>
                    <td>{item.no_jft}</td>
                    <td>{item.serial_number}</td>
                    <td>{item.description}</td>
                    <td>{item.size}</td>
                    <td>
                      <a
                        onClick={() => removeScannedItem(i + page * rowsPerPage)}
                        className="cursor-pointer"
                      >
                        <Trash2 size={20} color="#FF0000" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500">
                    Belum ada data barang yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="flex justify-end mt-4">
          <TablePagination
            component="div"
            rowsPerPageOptions={[5]}
            count={scannedData.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
