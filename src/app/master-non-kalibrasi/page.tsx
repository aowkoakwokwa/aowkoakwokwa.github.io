'use client';

import { SetStateAction, useEffect, useState } from 'react';
import { AddOutlined, RefreshOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import { Button, Input, Select, Option, Textarea, Checkbox, Table, Menu, MenuItem } from '@mui/joy';
import { TableHead, TableBody, TableRow, TableCell, TablePagination, Alert } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getNonMaster } from '@/lib/getData';
import { motion } from 'framer-motion';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';
import { useForm, Controller } from 'react-hook-form';
import { deleteNonMaster } from '@/lib/deleteData';
import { insertDataNonMaster } from '@/lib/insertData';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useUserStore } from '../../../store/store';
import { editDeleteDataNonMaster } from '@/lib/editData';

export default function MasterKalibrasi() {
  dayjs.extend(customParseFormat);
  const [openInsert, setOpenInsert] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(13);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userLevel = useUserStore((state) => state.userLevel);
  const handleCloseInsert = () => setOpenInsert(false);

  const handleChangePage = (_event: any, newPage: SetStateAction<number>) => setPage(newPage);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await editDeleteDataNonMaster(id),
    onSuccess: () => {
      setSelectedRows((prev) => prev.filter((id) => id !== selectedRows?.[0]));
      setOpenDialogDelete(false);
      masterData.refetch();
    },
    onError: (error) => {
      console.error('Gagal menghapus data:', error);
    },
  });

  const handleChangeRowsPerPage = (event: { target: { value: string } }) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const masterData = useQuery({
    queryKey: ['getNonMaster'],
    queryFn: getNonMaster,
    refetchOnWindowFocus: false,
  });

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const filteredRows =
    masterData.data?.filter((row: any) => {
      if (row.deleted === 1) return false;
      const matchesSearchTerm = Object.values(row).some(
        (value: any) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      );

      const matchesSourceFilter = sourceFilter
        ? row.calibration_source.toLowerCase().includes(sourceFilter.toLowerCase())
        : true;

      return matchesSearchTerm && matchesSourceFilter;
    }) || [];

  const LoadData = () => 'Loading..';

  if (masterData.isLoading) return <LoadData />;

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
    setSelectedRows([]);
  };

  const currentPage = 1;
  const sortedRows = [...filteredRows].sort((a, b) => b.id - a.id);
  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePrintBarcodeBesar = () => {
    if (selectedRows.length === 0) return;

    const filteredIDs = selectedRows.filter((row) => typeof row === 'number');

    if (filteredIDs.length === 0) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [80, 103],
      compress: false,
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    filteredIDs.forEach((id, idx) => {
      const rowData = filteredRows.find((row: any) => row.id === id);
      if (!rowData) return;

      const { no_jft, check, next } = rowData;
      if (!no_jft || !check || !next) return;

      const formattedCalibrationDate = new Date(check).toLocaleDateString();
      const formattedNextCalibration = new Date(next).toLocaleDateString();

      const svgContainer = document.createElement('div');
      const root = createRoot(svgContainer);
      root.render(<Barcode value={no_jft} format="CODE128" displayValue={false} />);

      setTimeout(() => {
        const svgElement = svgContainer.querySelector('svg');
        if (!svgElement) return;

        const svgRect = svgElement.getBoundingClientRect();
        const barcodeWidth = svgRect.width || 180;
        const barcodeHeight = svgRect.height || 60;

        const aspectRatio = 9 / 16;
        let canvasWidth = barcodeWidth + 80;
        let canvasHeight = canvasWidth / aspectRatio;

        if (canvasHeight < barcodeHeight + 120) {
          canvasHeight = barcodeHeight + 120;
          canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight - 30;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const logo = new Image();
        logo.src = '/images/logo-calibration.png';

        logo.onload = () => {
          const logoWidth = barcodeWidth + 27;
          const logoHeight = barcodeHeight - 20;
          const logoX = (canvasWidth - logoWidth + 27) / 2;
          const logoY = 10;

          ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

          ctx.font = 'bold 18px Arial';

          const labelX = 40;
          const colonX = 85;
          const valueX = 100;

          const baseY = logoY + logoHeight + 25;
          const lineSpacing = 25;
          ctx.fillText('CAL', labelX, baseY);
          ctx.fillText(':', colonX, baseY);
          ctx.fillText(formattedCalibrationDate, valueX, baseY);

          ctx.fillText('DUE', labelX, baseY + lineSpacing);
          ctx.fillText(':', colonX, baseY + lineSpacing);
          ctx.fillText(formattedNextCalibration, valueX, baseY + lineSpacing);

          ctx.fillText('BY', labelX, baseY + lineSpacing * 2);
          ctx.fillText(':', colonX, baseY + lineSpacing * 2);
          ctx.fillText('RUDI HASTOMO', valueX, baseY + lineSpacing * 2);

          ctx.save();
          ctx.translate(30, canvasHeight / 2 - 110);
          ctx.rotate(-Math.PI / 2);
          ctx.font = 'bold 28px Arial';
          ctx.fillText(`${no_jft}`, 0, 0);
          ctx.restore();

          const svgData = new XMLSerializer().serializeToString(svgElement);
          const img = new Image();
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

          img.onload = () => {
            const barcodeX = (canvasWidth - barcodeWidth) / 2;
            const barcodeY = logoY + logoHeight + 85;
            ctx.drawImage(img, barcodeX, barcodeY, barcodeWidth + 27, barcodeHeight - 20);

            const dataUrl = canvas.toDataURL('image/png', 1.0);

            doc.addImage(dataUrl, 'PNG', 0, 0, canvasWidth / 2.5, canvasHeight / 2.5);

            if (idx < filteredIDs.length - 1) {
              doc.addPage();
            }

            if (idx === filteredIDs.length - 1) {
              const pdfBlob = doc.output('blob');
              const url = URL.createObjectURL(pdfBlob);

              window.open(url, '_blank');
            }
          };

          img.onerror = () => {};
        };

        logo.onerror = () => {};
      }, 100);
    });
  };

  const handlePrintBarcodeKecil = () => {
    if (selectedRows.length === 0) return;

    const filteredIDs = selectedRows.filter((row) => typeof row === 'number');

    if (filteredIDs.length === 0) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [65, 103],
      compress: false,
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    filteredIDs.forEach((id, idx) => {
      const rowData = filteredRows.find((row: any) => row.id === id);
      if (!rowData) return;

      const { no_jft, check, next } = rowData;
      if (!no_jft || !check || !next) return;

      const formattedCalibrationDate = new Date(check).toLocaleDateString();
      const formattedNextCalibration = new Date(next).toLocaleDateString();

      const svgContainer = document.createElement('div');
      const root = createRoot(svgContainer);
      root.render(<Barcode value={no_jft} format="CODE128" displayValue={false} />);

      setTimeout(() => {
        const svgElement = svgContainer.querySelector('svg');
        if (!svgElement) return;

        const svgRect = svgElement.getBoundingClientRect();
        const barcodeWidth = svgRect.width || 180;
        const barcodeHeight = svgRect.height || 60;

        const aspectRatio = 9 / 16;
        let canvasWidth = barcodeWidth + 80;
        let canvasHeight = canvasWidth / aspectRatio;

        if (canvasHeight < barcodeHeight + 120) {
          canvasHeight = barcodeHeight + 120;
          canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight - 30;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 18px Arial';
        const labelX = 40;
        const colonX = 85;
        const valueX = 100;
        const baseY = 30;
        const lineSpacing = 25;

        ctx.fillText('CAL', labelX, baseY);
        ctx.fillText(':', colonX, baseY);
        ctx.fillText(formattedCalibrationDate, valueX, baseY);

        ctx.fillText('DUE', labelX, baseY + lineSpacing);
        ctx.fillText(':', colonX, baseY + lineSpacing);
        ctx.fillText(formattedNextCalibration, valueX, baseY + lineSpacing);

        ctx.fillText('BY', labelX, baseY + lineSpacing * 2);
        ctx.fillText(':', colonX, baseY + lineSpacing * 2);
        ctx.fillText('RUDI HASTOMO', valueX, baseY + lineSpacing * 2);

        ctx.save();
        ctx.translate(30, canvasHeight / 2 - 130);
        ctx.rotate(-Math.PI / 2);
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`${no_jft}`, 0, 0);
        ctx.restore();

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

        img.onload = () => {
          const barcodeX = (canvasWidth - barcodeWidth) / 2;
          const barcodeY = baseY + lineSpacing * 2.5;
          ctx.drawImage(img, barcodeX, barcodeY, barcodeWidth + 27, barcodeHeight - 20);

          const dataUrl = canvas.toDataURL('image/png', 1.0);

          doc.addImage(dataUrl, 'PNG', 0, 0, canvasWidth / 2.5, canvasHeight / 2.5);

          if (idx < filteredIDs.length - 1) {
            doc.addPage();
          }

          if (idx === filteredIDs.length - 1) {
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);

            window.open(url, '_blank');
          }
        };

        img.onerror = () => {};
      }, 100);
    });
  };

  const modeTambah = () => {
    setOpenInsert(true);
  };

  const formatDate = (val: string | null | undefined) => {
    if (!val || val === '-') return '-';

    const date = dayjs(val, 'D-M-YYYY', true);
    return date.isValid() ? date.format('DD/MM/YYYY') : '-';
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex gap-4 mb-6 items-center justify-between">
          <div className="flex justify-center items-center gap-4">
            <Button
              startDecorator={<AddOutlined />}
              color="success"
              onClick={modeTambah}
              sx={{ paddingY: 1.2 }}
              disabled={selectedRows.length > 0 || userLevel !== 'Admin'}
            >
              Tambah
            </Button>
            <Button
              startDecorator={<RefreshOutlined />}
              className="shadow-md p-3 rounded-lg"
              onClick={() => masterData.refetch()}
              sx={{ paddingY: 1.2 }}
            >
              Reload
            </Button>
            {selectedRows.length > 0 && (
              <div className="flex gap-4">
                <Button
                  startDecorator={<DeleteOutlineOutlined />}
                  color="danger"
                  onClick={() => {
                    if (selectedRows.length > 0) {
                      setOpenDialogDelete(true);
                    }
                  }}
                  sx={{ paddingY: 1.2 }}
                >
                  Hapus
                </Button>
                <Dialog
                  open={openDialogDelete}
                  onClose={(_, reason) => {
                    if (reason !== 'backdropClick') {
                      () => setOpenDialogDelete(false);
                    }
                  }}
                >
                  <DialogTitle>Konfirmasi</DialogTitle>
                  <DialogContent>
                    <p>Anda yakin ingin menghapus data??</p>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={async () => {
                        if (selectedRows.length === 0) {
                          console.error('Tidak ada data yang dipilih!');
                          return;
                        }

                        handleDelete(Number(selectedRows[0]));
                      }}
                      color="primary"
                    >
                      Yes
                    </Button>

                    <Button onClick={() => setOpenDialogDelete(false)} color="danger">
                      No
                    </Button>
                  </DialogActions>
                </Dialog>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Input
              className="w-64 p-2 border border-gray-300 rounded-lg"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4 border-b-2 border-gray-300 justify-between pb-3">
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="source">Filter Source</label>
              <Select
                placeholder="Choose one.."
                defaultValue={'semua'}
                onChange={(_, value) => setSourceFilter(value === 'semua' ? '' : (value ?? ''))}
              >
                <Option value="semua">Semua</Option>
                <Option value="internal">Internal</Option>
                <Option value="external">External</Option>
              </Select>
            </div>
            <Button onClick={handleOpenMenu} disabled={selectedRows.length === 0}>
              Cetak Barcode
            </Button>

            <Menu
              component="div"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              <MenuItem
                onClick={() => {
                  handlePrintBarcodeBesar();
                  handleCloseMenu();
                }}
              >
                Barcode Besar
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handlePrintBarcodeKecil();
                  handleCloseMenu();
                }}
              >
                Barcode Kecil
              </MenuItem>
            </Menu>
          </div>
        </div>

        <Table aria-label="Subitem Table">
          <TableHead>
            <TableRow>
              {userLevel === 'Admin' && <TableCell></TableCell>}
              <TableCell title="NCR No.">Jft No.</TableCell>
              <TableCell title="Source of NCR">Source of NCR</TableCell>
              <TableCell title="Description">Description</TableCell>
              <TableCell title="Serial Number">Serial Number</TableCell>
              <TableCell title="Store By">Store By</TableCell>
              <TableCell title="Jenis">Jenis</TableCell>
              <TableCell title="Note">Note</TableCell>
              <TableCell title="Calibration Date">Calibration Date</TableCell>
              <TableCell title="Next Calibration">Next Calibration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {masterData.isFetching ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  <div className="flex justify-center items-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedRows.length > 0 ? (
              paginatedRows.map((val: any) => {
                return (
                  <TableRow key={val.id}>
                    {userLevel === 'Admin' && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(val.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([val.id]);
                            } else {
                              setSelectedRows([]);
                            }
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell className="overflow-hidden truncate">{val.no_jft}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.size}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.description}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.serial_number}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.store_by}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.jenis}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.note}</TableCell>
                    <TableCell className="overflow-hidden truncate">
                      {dayjs(val.check).format('DD-MM-YYYY')}
                    </TableCell>
                    <TableCell className="overflow-hidden truncate">
                      {dayjs(val.next).format('DD-MM-YYYY')}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500">
                  No result found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 13]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <DialogTambah open={openInsert} handleClose={handleCloseInsert} masterData={masterData} />
      </div>
    </>
  );
}

const DialogTambah = ({
  open,
  handleClose,
  masterData,
}: {
  open: boolean;
  handleClose: () => void;
  masterData: any;
}) => {
  const userData = useUserStore((state) => state.userData);

  const form = useForm({
    defaultValues: {
      no_jft: '',
      size: '',
      description: '',
      serial_number: '',
      store_by: 'QC',
      check: new Date().toISOString().split('T')[0],
      next: '',
      jenis: '',
      keterangan: '',
    },
  });

  const mutasi = useMutation({
    mutationFn: async (data) => await insertDataNonMaster(data),
    onSuccess: () => {
      form.reset();
      handleClose();
      masterData.refetch();
    },
    onError: (err) => {
      console.error(err);
    },
  });

  useEffect(() => {
    const values = form.getValues();
    if (values.check && values.jenis) {
      const date = new Date(values.check);
      const freq = parseInt(values.jenis, 10) || 0;

      form.setValue('check', new Date().toISOString().split('T')[0], {
        shouldValidate: true,
      });
      form.setValue('next', date.toISOString().split('T')[0], { shouldValidate: true });

      form.setValue('jenis', values.jenis, { shouldValidate: true });
    }
  }, [form.watch('check'), form.watch('jenis')]);

  const onSubmit = async (formData: any) => {
    try {
      const isDuplicate = masterData.data?.some(
        (item: any) => item.no_jft?.toUpperCase().trim() === formData.no_jft?.toUpperCase().trim(),
      );

      if (isDuplicate) {
        alert('❌ No. JFT sudah ada. Silakan gunakan nomor lain.');
        return;
      }

      const dataToSubmit = {
        ...formData,
        users: userData?.username,
      };
      mutasi.mutate(dataToSubmit);

      handleClose();
      form.reset();
      masterData.refetch();
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      maxWidth="md"
      fullWidth
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>Form Entry Master Non Calibration</DialogTitle>
        <DialogContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="mb-4">
                <label className="block font-medium mb-1">JFT No.</label>
                <Controller
                  control={form.control}
                  name="no_jft"
                  render={({ field: { value, onChange } }) => (
                    <div className="flex flex-col">
                      <Input
                        required
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="Type something.."
                      />
                    </div>
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Size</label>
                <Controller
                  control={form.control}
                  name="size"
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
              <div className="mb-4">
                <label className="block font-medium mb-1">Description</label>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field: { value, onChange } }) => (
                    <Textarea
                      required
                      value={value ?? ''}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      minRows={2}
                      placeholder="Type anything.."
                    />
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Serial Number</label>
                <Controller
                  control={form.control}
                  name="serial_number"
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
              <div className="mb-4">
                <label className="block font-medium mb-1">Store By</label>
                <div className="flex gap-4">
                  <div className="flex gap-1">
                    <label htmlFor="qcTambah" className="flex gap-x-1 cursor-pointer">
                      <input
                        id="qcTambah"
                        type="radio"
                        checked={form.watch('store_by') === 'QC'}
                        onChange={() => form.setValue('store_by', 'QC')}
                      />
                      QC
                    </label>
                  </div>
                  <div className="flex gap-1">
                    <label htmlFor="productionTambah" className="flex gap-x-1 cursor-pointer">
                      <input
                        id="productionTambah"
                        type="radio"
                        checked={form.watch('store_by') === 'Production'}
                        onChange={() => form.setValue('store_by', 'Production')}
                      />
                      Production
                    </label>
                  </div>
                  <div className="flex gap-1">
                    <label htmlFor="otherTambah" className="flex gap-x-1 cursor-pointer">
                      <input
                        id="otherTambah"
                        type="radio"
                        checked={form.watch('store_by') === 'Other'}
                        onChange={() => form.setValue('store_by', 'Other')}
                      />
                      Other
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg p-4">
              <div className="mb-4">
                <label className="block font-medium mb-1">Keterangan</label>
                <Controller
                  control={form.control}
                  name="keterangan"
                  render={({ field: { value, onChange } }) => (
                    <Textarea
                      required
                      value={value ?? ''}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      minRows={2}
                      placeholder="Type anything.."
                    />
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Frequency</label>
                <Controller
                  control={form.control}
                  name="jenis"
                  render={({ field: { value, onChange } }) => {
                    return (
                      <Select
                        className="w-full"
                        placeholder="Choose one.."
                        value={value}
                        onChange={(_, newValue) => onChange(newValue)}
                        slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                        sx={{ py: 1 }}
                      >
                        <Option value="Internal">Indentitas</Option>
                      </Select>
                    );
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Calibration Date</label>
                <Controller
                  control={form.control}
                  name="check"
                  render={({ field: { value, onChange } }) => {
                    return (
                      <input
                        type="text"
                        value={'-'}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                      />
                    );
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Next Calibration</label>
                <Controller
                  control={form.control}
                  name="next"
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="text"
                      value={'-'}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button type="submit" color="success">
            Save
          </Button>
          <Button onClick={handleClose} color="danger">
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
