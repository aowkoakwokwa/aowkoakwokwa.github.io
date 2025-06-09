'use client';

import { SetStateAction, useEffect, useState } from 'react';
import {
  AddOutlined,
  RefreshOutlined,
  CreateOutlined,
  DeleteOutlineOutlined,
  CalendarMonthOutlined,
  ExitToAppOutlined,
  ListAltOutlined,
} from '@mui/icons-material';
import { Button, Input, Select, Option, Textarea, Checkbox, Table, Menu, MenuItem } from '@mui/joy';
import { TableHead, TableBody, TableRow, TableCell, TablePagination, Alert } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getMaster } from '@/lib/getData';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx-js-style';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';
import { useForm, Controller } from 'react-hook-form';
import { insertDataMaster } from '@/lib/insertData';
import { editDataMaster, perpanjangDataMaster, editDeleteData } from '@/lib/editData';
import Cardek from './cardek';
import dayjs from 'dayjs';
import { useUserStore } from '../../../store/store';

export default function MasterKalibrasi() {
  const [openInsert, setOpenInsert] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(13);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [openDialogExtend, setOpenDialogExtend] = useState(false);
  const [openDialogNextCalibration, setOpenDialogNextCalibration] = useState(false);
  const [openCardek, setOpenCardek] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userLevel = useUserStore((state) => state.userLevel);
  const handleCloseInsert = () => setOpenInsert(false);
  const handleCloseEdit = () => setOpenEdit(false);
  const handleChangePage = (_event: any, newPage: SetStateAction<number>) => setPage(newPage);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await editDeleteData(id),
    onSuccess: () => {
      setSelectedRows((prev) => prev.filter((id) => id !== selectedRows?.[0]));
      setTableSelect('');
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

  const [tableSelect, setTableSelect] = useState<number | string>('');
  const [dataEdit, setDataEdit] = useState<any>('');
  const [dataPerpanjang, setDataPerpanjang] = useState<any>('');

  const masterData = useQuery({
    queryKey: ['getMaster'],
    queryFn: getMaster,
    refetchOnWindowFocus: false,
  });

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const filteredRows =
    masterData.data
      ?.filter((row: any) => {
        if (row.deleted === 1) return false;

        const today = new Date().toISOString().split('T')[0];

        const isExpired = new Date(row.next_calibration).toISOString().split('T')[0] <= today;
        const isUpdated = new Date(row.next_calibration).toISOString().split('T')[0] > today;

        const matchesStatus =
          filterStatus === 'expired'
            ? isExpired
            : filterStatus === 'aktif'
              ? isUpdated
              : row.status.toLowerCase().includes(filterStatus.toLowerCase());

        const matchesSearchTerm = Object.values(row).some(
          (value: any) =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
        );

        const matchesSourceFilter = sourceFilter
          ? row.calibration_source.toLowerCase().includes(sourceFilter.toLowerCase())
          : true;

        return matchesSearchTerm && matchesStatus && matchesSourceFilter;
      })
      ?.sort((a: any, b: any) => {
        const today = new Date().toISOString().split('T')[0];
        const aExpired = new Date(a.next_calibration).toISOString().split('T')[0] <= today;
        const bExpired = new Date(b.next_calibration).toISOString().split('T')[0] <= today;

        if (aExpired && !bExpired) return -1;
        if (!aExpired && bExpired) return 1;
        return 0;
      }) || [];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    const hasExpiredItems = masterData.data?.some((row: any) => {
      const calibrationDate = new Date(row.next_calibration).toISOString().split('T')[0];
      return calibrationDate <= today;
    });

    if (filterStatus === '') {
      if (hasExpiredItems) {
        setFilterStatus('expired');
      } else {
        setFilterStatus('aktif');
      }
    }
  }, [masterData.data, filterStatus]);

  const LoadData = () => 'Loading..';

  if (masterData.isLoading) return <LoadData />;

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const currentPage = 1;
  const sortedRows = [...filteredRows].sort((a, b) => b.id - a.id);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const handleOpenNextCalibration = () => {
    setOpenDialogNextCalibration(true);
  };

  const handleCloseNextCalibration = () => {
    setOpenDialogNextCalibration(false);
  };

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
      const rowData = filteredRows.find((row) => row.id === id);
      if (!rowData) return;

      const { no_jft, calibration_date, next_calibration } = rowData;
      if (!no_jft || !calibration_date || !next_calibration) return;

      const formattedCalibrationDate = new Date(calibration_date).toLocaleDateString();
      const formattedNextCalibration = new Date(next_calibration).toLocaleDateString();

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
      const rowData = filteredRows.find((row) => row.id === id);
      if (!rowData) return;

      const { no_jft, calibration_date, next_calibration } = rowData;
      if (!no_jft || !calibration_date || !next_calibration) return;

      const formattedCalibrationDate = new Date(calibration_date).toLocaleDateString();
      const formattedNextCalibration = new Date(next_calibration).toLocaleDateString();

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

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredRows.map((item, index) => ({
        'No.': index + 1,
        'JFT.No.': item.no_jft,
        Size: item.size,
        Description: item.description,
        'Serial Number': item.serial_number,
        'Store By': item.store_by,
        Frequency: item.frequency,
        'Cal. Source': item.calibration_source,
        'Cal. Date': item.calibration_date
          ? new Date(item.calibration_date).toLocaleDateString()
          : '',
        'Next Cal.': item.next_calibration
          ? new Date(item.next_calibration).toLocaleDateString()
          : '',
        'Ref. Criteria': item.ref_criteria,
      })),
      {
        header: [
          'No.',
          'JFT.No.',
          'Size',
          'Description',
          'Serial Number',
          'Store By',
          'Frequency',
          'Cal. Source',
          'Cal. Date',
          'Next Cal.',
          'Ref. Criteria',
        ],
        origin: 1,
      } as XLSX.JSON2SheetOpts,
    );

    ws['A1'] = {
      v: 'QUALITY CONTROL JFT LIST',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' }, size: 14, name: 'Arial' },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: '008078' } },
      },
    };

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];

    const headerStyle = {
      fill: { fgColor: { rgb: '008078' } },
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const headers = ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2'];
    headers.forEach((header) => {
      if (!ws[header]) ws[header] = {};
      ws[header].s = headerStyle;
    });

    const rowStyle = {
      fill: { fgColor: { rgb: 'CCFFCC' } },
      font: { color: { rgb: '000000' }, size: 11, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    for (let i = 3; i <= filteredRows.length + 2; i++) {
      for (let col = 0; col < 11; col++) {
        const cell = `${String.fromCharCode(65 + col)}${i}`;
        if (!ws[cell]) ws[cell] = {};
        ws[cell].s = rowStyle;
      }
    }

    const columnWidths = [
      { wpx: 50 },
      { wpx: 100 },
      { wpx: 50 },
      { wpx: 150 },
      { wpx: 150 },
      { wpx: 100 },
      { wpx: 75 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 150 },
    ];
    ws['!cols'] = columnWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quality Control JFT List');

    XLSX.writeFile(wb, 'quality_control_jft_list.xlsx');
  };

  const modeTambah = () => {
    setOpenInsert(true);
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
            <Button
              startDecorator={<ExitToAppOutlined />}
              className="shadow-md p-3 rounded-lg"
              onClick={handleExport}
              sx={{ paddingY: 1.2, display: selectedRows.length > 0 ? 'none' : 'inherit' }}
            >
              Export
            </Button>
            {selectedRows.length > 0 && (
              <div className="flex gap-4">
                <Button
                  startDecorator={<CreateOutlined />}
                  color="success"
                  onClick={() => {
                    if (selectedRows.length > 0) {
                      const temp = filteredRows.filter((val) => val.id === tableSelect);
                      setDataEdit(temp[0]);
                      setOpenEdit(true);
                    } else {
                    }
                  }}
                  sx={{ paddingY: 1.2 }}
                >
                  Edit
                </Button>
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
                <Dialog open={openDialogDelete} onClose={() => setOpenDialogDelete(false)}>
                  <DialogTitle>Konfirmasi</DialogTitle>
                  <DialogContent>
                    <p>Anda yakin ingin menghapus data??</p>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => {
                        const selectedId = selectedRows?.[0];
                        if (!selectedId) {
                          console.error('Tidak ada data yang dipilih!');
                          return;
                        }

                        handleDelete(selectedId);
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
                <Button
                  startDecorator={<CalendarMonthOutlined />}
                  color="primary"
                  onClick={() => setOpenDialogExtend(true)}
                  sx={{ paddingY: 1.2 }}
                >
                  Perpanjang
                </Button>
                <Button
                  startDecorator={<ListAltOutlined />}
                  onClick={() => setOpenCardek(true)}
                  sx={{
                    paddingY: 1.2,
                    backgroundColor: '#FFA500',
                    ':hover': { backgroundColor: '#F28C28' },
                  }}
                >
                  Cardek
                </Button>
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
          <div className="flex gap-4 justify-center items-center">
            <div className="flex gap-x-1">
              <label htmlFor="filterAktif" className="flex gap-x-1 cursor-pointer">
                <input
                  id="filterAktif"
                  name="filterStatus"
                  type="radio"
                  onChange={() => setFilterStatus('aktif')}
                  checked={filterStatus === 'aktif' || filterStatus === ''}
                />
                Update
              </label>
            </div>

            <div className="flex gap-x-1">
              <label htmlFor="filterExpired" className="flex gap-x-1 cursor-pointer">
                <input
                  id="filterExpired"
                  type="radio"
                  name="filterStatus"
                  onChange={() => setFilterStatus('expired')}
                  checked={filterStatus === 'expired'}
                />
                Expired
              </label>
            </div>
          </div>
        </div>
        <Cardek open={openCardek} close={() => setOpenCardek(false)} dataCardeck={selectedRows} />
        <Table aria-label="Subitem Table">
          <TableHead>
            <TableRow>
              {userLevel === 'Admin' && <TableCell></TableCell>}
              <TableCell title="NCR No.">Jft No.</TableCell>
              <TableCell title="Source of NCR">Source of NCR</TableCell>
              <TableCell title="Description">Description</TableCell>
              <TableCell title="Serial Number">Serial Number</TableCell>
              <TableCell title="Store By">Store By</TableCell>
              <TableCell title="Frequency">Frequency</TableCell>
              <TableCell title="Calibration Source">Calibration Source</TableCell>
              <TableCell title="Calibration Date">Calibration Date</TableCell>
              <TableCell title="Next Calibration">Next Calibration</TableCell>
              <TableCell title="Ref. Criteria">Ref. Criteria</TableCell>
              <TableCell title="Status">Status</TableCell>
              <TableCell title="Degree Usage">Degree Usage</TableCell>
              <TableCell title="Keterangan">Keterangan</TableCell>
              <TableCell title="Lampiran">Lampiran</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {masterData.isFetching ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center">
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
                const isExpired =
                  val.next_calibration &&
                  new Date(val.next_calibration).toISOString().split('T')[0] <=
                    new Date().toISOString().split('T')[0];

                return (
                  <TableRow key={val.id} className={isExpired ? 'bg-[#FFE2E2]' : ''}>
                    {userLevel === 'Admin' && (
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(val.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([
                                val.id,
                                val.no_jft,
                                val.frequency,
                                val.calibration_source,
                                val.ref_criteria,
                                val.description,
                              ]);
                              setTableSelect(val.id);
                            } else {
                              setSelectedRows([]);
                              setTableSelect('');
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
                    <TableCell className="overflow-hidden truncate">{val.frequency}</TableCell>
                    <TableCell className="overflow-hidden truncate">
                      {val.calibration_source}
                    </TableCell>
                    <TableCell className="overflow-hidden truncate">
                      {dayjs(val.calibration_date).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell className="overflow-hidden truncate">
                      {dayjs(val.next_calibration).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell className="overflow-hidden truncate">{val.ref_criteria}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.status}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.degree_usage}</TableCell>
                    <TableCell className="overflow-hidden truncate">{val.keterangan}</TableCell>
                    <TableCell>
                      <a
                        href={val.lampiran}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        Lihat
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-gray-500">
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
        <DialogTambah
          open={openInsert}
          handleClose={handleCloseInsert}
          masterData={masterData}
          success={() => setSelectedRows([])}
        />
        <DialogEdit
          open={openEdit}
          handleClose={handleCloseEdit}
          data={dataEdit}
          masterData={masterData}
          success={() => setSelectedRows([])}
        />
        <Dialog open={openDialogExtend} onClose={() => setOpenDialogExtend(false)}>
          <DialogTitle>Konfirmasi</DialogTitle>
          <DialogContent>
            <p>Anda ingin memprepanjang priode kalibrasi??</p>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (selectedRows.length > 0) {
                  const temp = filteredRows.filter((val) => val.id === tableSelect);
                  setDataPerpanjang(temp[0]);
                  handleOpenNextCalibration();
                  setOpenDialogExtend(false);
                } else {
                }
              }}
              color="primary"
            >
              Yes
            </Button>
            <Button onClick={() => setOpenDialogExtend(false)} color="danger">
              No
            </Button>
          </DialogActions>
        </Dialog>
        <DialogPerpanjang
          open={openDialogNextCalibration}
          handleClose={handleCloseNextCalibration}
          data={dataPerpanjang}
          masterData={masterData}
          dataSelect={selectedRows}
          success={() => setSelectedRows([])}
        />
      </div>
    </>
  );
}

const DialogPerpanjang = ({
  open,
  handleClose,
  data,
  masterData,
  success,
}: {
  open: boolean;
  handleClose: () => void;
  data: any;
  masterData: any;
  dataSelect: any;
  success?: () => void;
}) => {
  const form = useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const calibrationDate = form.watch('calibration_date');
  const userData = useUserStore((state) => state.userData);
  const frequency = form.watch('frequency');

  useEffect(() => {
    if (data) {
      Object.entries(data).forEach(([key, nilai]) => {
        form.setValue(key, nilai);
      });
    } else {
      form.reset();
    }
  }, [data, form]);

  useEffect(() => {
    const lampiran = form.watch('lampiran');
    if (lampiran) {
      setSelectedFile(null);
    }
  }, [form.watch('lampiran')]);

  useEffect(() => {
    if (calibrationDate && frequency) {
      const date = new Date(calibrationDate);
      const [num, unit] = frequency.split(' ');
      const freq = parseInt(num, 10) || 0;

      if (unit === 'Week') {
        date.setDate(date.getDate() + freq * 7);
      } else if (unit === 'Month') {
        date.setMonth(date.getMonth() + freq);
      } else if (unit === 'Year') {
        date.setFullYear(date.getFullYear() + freq);
      }

      const newDate = date.toISOString().split('T')[0];

      if (form.watch('next_calibration') !== newDate) {
        form.setValue('next_calibration', newDate);
      }
    }
  }, [calibrationDate, frequency, form]);

  const handleCloseModal = () => {
    form.reset({ cir_no: '' });
    handleClose();
  };

  const mutasi = useMutation({
    mutationFn: async (data) => await perpanjangDataMaster(data),
    onSuccess: () => {
      form.reset();
      form.setValue('lampiran', '');
      handleClose();
      setSelectedFile(null);
      masterData.refetch();
      success?.();
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const onSubmit = async (formData: any) => {
    try {
      const checkResponse = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cir_no: formData.cir_no }),
      });

      const checkResult = await checkResponse.json();

      if (checkResult.exists) {
        alert(`CIR No "${formData.cir_no}" sudah digunakan. Gunakan nomor lain.`);
        return;
      }

      let lampiranPath = formData.lampiran || '';
      if (selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('lampiran', selectedFile);
        formDataUpload.append('no_jft', formData.no_jft);
        const uploadResponse = await fetch('/api/upload/kalibrasi', {
          method: 'POST',
          body: formDataUpload,
        });
        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }
        const fileData = await uploadResponse.json();
        lampiranPath = `/lampiran/kalibrasi/${fileData.fileName}`;
      }

      const updatedData = {
        ...formData,
        lampiran: lampiranPath,
        status: 'Aktif',
        users: userData?.username,
        keterangan: '-',
      };

      setOpenSnackbar(true);
      mutasi.mutate(updatedData);
      handleClose();
      form.reset();
      setSelectedFile(null);
      masterData.refetch();
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  useEffect(() => {
    if (openSnackbar) {
      const timer = setTimeout(() => {
        setOpenSnackbar(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [openSnackbar]);

  return (
    <>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            sx={{ width: '100%', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }}
          >
            Data berhasil diperbarui!
          </Alert>
        </Snackbar>
      </motion.div>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTitle>Form Perpanjangan Kalibrasi</DialogTitle>
          <DialogContent className="space-y-4" sx={{ pb: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className="p-4 hidden">
                <div className="mb-4 hidden">
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
                <div className="mb-4 hidden">
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
                <div className="mb-4 hidden">
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
                <div className="mb-4 hidden">
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
                <div className="mb-4 hidden">
                  <label className="block font-medium mb-1">Store By</label>
                  <div className="flex gap-4">
                    <div className="flex gap-1">
                      <label htmlFor="">QC</label>
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="radio"
                        checked={form.watch('store_by') === 'Production'}
                        onChange={() => form.setValue('store_by', 'Production')}
                      />
                      <label htmlFor="">Production</label>
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="radio"
                        checked={form.watch('store_by') === 'Other'}
                        onChange={() => form.setValue('store_by', 'Other')}
                      />
                      <label htmlFor="">Other</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 hidden">
                <div className="mb-4 hidden">
                  <label className="block font-medium mb-1">Calibration Source</label>
                  <Controller
                    control={form.control}
                    name="calibration_source"
                    render={({ field: { value, onChange } }) => {
                      const selectedValue =
                        value === 'Internal' || value === 'Eksternal' ? value : '';

                      return (
                        <Select
                          className="w-full"
                          placeholder="Choose one.."
                          value={selectedValue}
                          onChange={(_, newValue) => onChange(newValue)}
                          slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                          sx={{ py: 1 }}
                        >
                          <Option value="">Select Source</Option>
                          <Option value="Internal">Internal</Option>
                          <Option value="Eksternal">Eksternal</Option>
                        </Select>
                      );
                    }}
                  />
                </div>
                <div className="mb-4 hidden">
                  <label className="block font-medium mb-1">Degree Usages</label>
                  <Controller
                    control={form.control}
                    name="degree_usage"
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
              </div>
              <div>
                <div>
                  <div className="mb-4">
                    <label className="block font-medium mb-1">Calibration Date</label>
                    <Controller
                      control={form.control}
                      name="calibration_date"
                      render={({ field: { value, onChange } }) => {
                        const today = new Date();
                        const formattedDate = value
                          ? new Date(value).toISOString().split('T')[0]
                          : '';

                        return (
                          <input
                            type="date"
                            value={formattedDate}
                            onChange={(e) => onChange(e.target.value)}
                            min={today.toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                          />
                        );
                      }}
                    />
                  </div>

                  <div className="mb-4 hidden">
                    <label className="block font-medium mb-1">Frequency</label>
                    <Controller
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g. 22 Week"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                        />
                      )}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block font-medium mb-1">Next Calibration</label>
                    <Controller
                      control={form.control}
                      name="next_calibration"
                      render={({ field: { value } }) => {
                        const formattedDate = value
                          ? new Date(value).toISOString().split('T')[0]
                          : '';

                        return (
                          <input
                            type="date"
                            disabled
                            value={formattedDate}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-[#a5acb3] pointer-events-none"
                          />
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">CIR No.</label>
                  <Controller
                    control={form.control}
                    name="cir_no"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value.toLocaleUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none uppercase"
                        placeholder="Type something.."
                      />
                    )}
                  />
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Ref. Criteria</label>
                  <Controller
                    control={form.control}
                    name="ref_criteria"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="Type something.."
                      />
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Lampiran</label>
                  <div className="flex gap-2">
                    <Controller
                      control={form.control}
                      name="lampiran"
                      render={({ field: { value } }) => (
                        <Input
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Pilih file..."
                          value={selectedFile ? selectedFile.name : ''}
                          disabled
                        />
                      )}
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
              </div>
            </div>
            <div className="w-full">
              <div>
                <div className="flex items-center w-full">
                  <div className="flex-grow h-px bg-gray-300" />
                  <span className="mx-4 text-sm text-gray-500 whitespace-nowrap bg-white px-2">
                    Cardek
                  </span>
                  <div className="flex-grow h-px bg-gray-300" />
                </div>
              </div>
              <div className="flex flex-row w-full gap-4">
                <div className="w-full">
                  <div className="mb-4">
                    <label className="block font-medium mb-1">Cert No.</label>
                    <Controller
                      control={form.control}
                      defaultValue={'-'}
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
                      defaultValue={'PT SAGATRADE MURNI'}
                      name="cal_location"
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pointer-events-none cursor-default focus:outline-none uppercase"
                          placeholder="Type something.."
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="mb-4">
                    <label className="block font-medium mb-1">Name</label>
                    <Controller
                      control={form.control}
                      defaultValue={'RUDI HASTOMO'}
                      name="cal_name"
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pointer-events-none cursor-default focus:outline-none uppercase"
                          placeholder="Type something.."
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <div className="flex w-full justify-end px-4 pb-4">
              <div className="flex gap-2">
                <Button type="submit" color="success">
                  Save
                </Button>
                <Button onClick={handleCloseModal} color="danger">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

const DialogTambah = ({
  open,
  handleClose,
  masterData,
  success,
}: {
  open: boolean;
  handleClose: () => void;
  masterData: any;
  success?: () => void;
}) => {
  const form = useForm({
    defaultValues: {
      no_jft: '',
      size: '',
      description: '',
      serial_number: '',
      store_by: 'QC',
      calibration_source: '',
      frequency: '',
      unit: 'Week',
      degree_usage: '',
      calibration_date: new Date().toISOString().split('T')[0],
      next_calibration: '',
      ref_criteria: '',
      lampiran: '',
      status: '',
      keterangan: '',
      bulan: '',
      tahun: '',
    },
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [combinedFrequency, setCombinedFrequency] = useState(` ${form.getValues('unit')}`);
  const userData = useUserStore((state) => state.userData);
  const mutasi = useMutation({
    mutationFn: async (data) => await insertDataMaster(data),
    onSuccess: () => {
      form.reset();
      form.setValue('lampiran', '');
      handleClose();
      setSelectedFile(null);
      masterData.refetch();
      success?.();
    },
    onError: (err) => {
      console.error(err);
    },
  });

  useEffect(() => {
    const values = form.getValues();
    if (values.calibration_date && values.frequency) {
      const date = new Date(values.calibration_date);
      const freq = parseInt(values.frequency, 10) || 0;

      if (values.unit === 'Week') {
        date.setDate(date.getDate() + freq * 7);
      } else if (values.unit === 'Month') {
        date.setMonth(date.getMonth() + freq);
      } else if (values.unit === 'Year') {
        date.setFullYear(date.getFullYear() + freq);
      }

      form.setValue('calibration_date', new Date().toISOString().split('T')[0], {
        shouldValidate: true,
      });
      form.setValue('next_calibration', date.toISOString().split('T')[0], { shouldValidate: true });

      form.setValue('frequency', values.frequency, { shouldValidate: true });

      const frequency = form.watch('frequency');
      const unit = form.watch('unit');
      setCombinedFrequency(frequency && unit ? `${frequency} ${unit}` : frequency || '');
    }
  }, [form.watch('calibration_date'), form.watch('frequency'), form.watch('unit')]);

  const onSubmit = async (formData: any) => {
    try {
      let lampiranPath = '';

      if (selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('lampiran', selectedFile);
        formDataUpload.append('no_jft', formData.no_jft);

        const uploadResponse = await fetch('/api/upload/kalibrasi', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }

        const fileData = await uploadResponse.json();

        lampiranPath = `/lampiran/kalibrasi/${fileData.fileName}`;
      }

      const dataToSubmit = {
        ...formData,
        lampiran: lampiranPath,
        status: 'Aktif',
        keterangan: '-',
        users: userData?.username,
        tahun: formData.calibration_date.split('-')[0],
        bulan: formData.calibration_date.split('-')[1],
      };

      mutasi.mutate(dataToSubmit);

      handleClose();
      form.reset();
      setSelectedFile(null);
      masterData.refetch();
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>Form Entry Master Calibration</DialogTitle>
        <DialogContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="mb-4">
                <label className="block font-medium mb-1">JFT No.</label>
                <Controller
                  control={form.control}
                  name="no_jft"
                  rules={{
                    validate: (value) => value.trim() !== '' || '',
                  }}
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
                  rules={{
                    validate: (value) => value.trim() !== '' || '',
                  }}
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
                  rules={{
                    validate: (value) => value.trim() !== '' || '',
                  }}
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
                  rules={{
                    validate: (value) => value.trim() !== '' || '',
                  }}
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
                <label className="block font-medium mb-1">Calibration Source</label>
                <Controller
                  control={form.control}
                  name="calibration_source"
                  render={({ field: { value, onChange } }) => (
                    <Select
                      className="w-full"
                      placeholder="Choose one.."
                      value={value || ''}
                      onChange={(_, newValue) => {
                        if (newValue) {
                          onChange(newValue);
                        }
                      }}
                      slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                      sx={{ py: 1 }}
                    >
                      <Option value="Internal">Internal</Option>
                      <Option value="Eksternal">Eksternal</Option>
                    </Select>
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Frequency</label>
                <div className="flex gap-2">
                  <Controller
                    control={form.control}
                    name="frequency"
                    rules={{
                      validate: (value) => value.trim() !== '' || '',
                    }}
                    render={({ field }) => (
                      <Input
                        required
                        {...field}
                        type="number"
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="Enter frequency.."
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                        }}
                        value={field.value || ''}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <Select
                        {...field}
                        className="w-1/2"
                        placeholder="Choose one.."
                        slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                        onChange={(_, newValue) => {
                          field.onChange(newValue);
                        }}
                        value={field.value || ''}
                      >
                        <Option value="Week">Week</Option>
                        <Option value="Month">Month</Option>
                        <Option value="Year">Year</Option>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Degree Usages</label>
                <Controller
                  control={form.control}
                  name="degree_usage"
                  rules={{
                    validate: (value) => value.trim() !== '' || '',
                  }}
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
                <label className="block font-medium mb-1">Calibration Date</label>
                <Controller
                  control={form.control}
                  name="calibration_date"
                  render={({ field: { value, onChange } }) => {
                    const formattedDate = value ? new Date(value).toISOString().split('T')[0] : '';

                    return (
                      <input
                        type="date"
                        value={formattedDate ?? ''}
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
                  name="next_calibration"
                  render={({ field }) => (
                    <input
                      type="date"
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                      disabled
                    />
                  )}
                />
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="mb-4">
                <label className="block font-medium mb-1">Ref. Criteria</label>
                <Controller
                  control={form.control}
                  name="ref_criteria"
                  rules={{
                    validate: (value) => value.trim() !== '' || '',
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      value={value ?? ''}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                      placeholder="Type something.."
                    />
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1">Lampiran</label>
                <div className="flex gap-2">
                  <Input
                    className="w-full px-3 py-2 border rounded-lg pointer-events-none placeholder:text-black"
                    placeholder="Pilih file..."
                    value={selectedFile ? selectedFile.name : ''}
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

const DialogEdit = ({
  open,
  handleClose,
  data,
  masterData,
  success,
}: {
  open: boolean;
  handleClose: () => void;
  data: any;
  masterData: any;
  success?: () => void;
}) => {
  const form = useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const userData = useUserStore((state) => state.userData);
  const [combinedFrequency, setCombinedFrequency] = useState(` ${form.getValues('unit')}`);

  useEffect(() => {
    if (data) {
      Object.entries(data).map(([key, nilai]) => form.setValue(key, nilai));
    } else {
      form.reset();
    }
  }, [JSON.stringify(data)]);

  useEffect(() => {
    if (data?.frequency) {
      const [num, unit] = data.frequency.split(' ');
      form.setValue('frequency', num);
      form.setValue('unit', unit);
    }
  }, [data?.frequency, form]);
  useEffect(() => {
    const values = form.getValues();
    if (values.calibration_date && values.frequency) {
      const date = new Date(values.calibration_date);
      const freq = parseInt(values.frequency, 10) || 0;

      if (values.unit === 'Week') {
        date.setDate(date.getDate() + freq * 7);
      } else if (values.unit === 'Month') {
        date.setMonth(date.getMonth() + freq);
      } else if (values.unit === 'Year') {
        date.setFullYear(date.getFullYear() + freq);
      }

      form.setValue('calibration_date', new Date().toISOString().split('T')[0], {
        shouldValidate: true,
      });
      form.setValue('next_calibration', date.toISOString().split('T')[0], { shouldValidate: true });

      form.setValue('frequency', values.frequency, { shouldValidate: true });

      const frequency = form.watch('frequency');
      const unit = form.watch('unit');
      setCombinedFrequency(frequency && unit ? `${frequency} ${unit}` : frequency || '');
    }
  }, [form.watch('calibration_date'), form.watch('frequency'), form.watch('unit')]);

  useEffect(() => {
    if (form.watch('lampiran')) {
      setSelectedFile(null);
    }
  }, [form.watch('lampiran')]);

  const mutasi = useMutation({
    mutationFn: async (data) => await editDataMaster(data),
    onSuccess: () => {
      form.reset();
      form.setValue('lampiran', '');
      handleClose();
      setSelectedFile(null);
      masterData.refetch();
      success?.();
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const onSubmit = async (formData: any) => {
    try {
      let lampiranPath = formData.lampiran || '';

      if (selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('lampiran', selectedFile);
        formDataUpload.append('no_jft', formData.no_jft);

        const uploadResponse = await fetch('/api/upload/kalibrasi', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }

        const fileData = await uploadResponse.json();
        console.log('File uploaded successfully:', fileData);

        lampiranPath = `/lampiran/kalibrasi/${fileData.fileName}`;
      }

      const updatedData = {
        ...formData,
        lampiran: lampiranPath,
        status: 'Aktif',
        users: userData?.username,
        keterangan: '-',
      };

      console.log(updatedData);

      await editDataMaster(updatedData);

      setOpenSnackbar(true);

      mutasi.mutate(updatedData);
      handleClose();
      form.reset();
      setSelectedFile(null);
      masterData.refetch();
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  useEffect(() => {
    if (openSnackbar) {
      const timer = setTimeout(() => {
        setOpenSnackbar(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [openSnackbar]);
  return (
    <>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            sx={{ width: '100%', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }}
          >
            Data berhasil diperbarui!
          </Alert>
        </Snackbar>
      </motion.div>

      <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTitle>Form Entry Master Calibration</DialogTitle>
          <DialogContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <label htmlFor="qcEdit" className="flex gap-x-1 cursor-pointer">
                        <input
                          id="qcEdit"
                          type="radio"
                          checked={form.watch('store_by') === 'QC'}
                          onChange={() => form.setValue('store_by', 'QC')}
                        />
                        QC
                      </label>
                    </div>
                    <div className="flex gap-1">
                      <label htmlFor="productionEdit" className="flex gap-x-1 cursor-pointer">
                        <input
                          id="productionEdit"
                          type="radio"
                          checked={form.watch('store_by') === 'Production'}
                          onChange={() => form.setValue('store_by', 'Production')}
                        />
                        Production
                      </label>
                    </div>
                    <div className="flex gap-1">
                      <label htmlFor="otherEdit" className="flex gap-x-1 cursor-pointer">
                        <input
                          id="otherEdit"
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
                  <label className="block font-medium mb-1">Calibration Source</label>
                  <Controller
                    control={form.control}
                    name="calibration_source"
                    render={({ field: { value, onChange } }) => {
                      const selectedValue =
                        value === 'Internal' || value === 'Eksternal' ? value : '';

                      return (
                        <Select
                          className="w-full"
                          placeholder="Choose one.."
                          value={selectedValue}
                          onChange={(_, newValue) => onChange(newValue)}
                          slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                          sx={{ py: 1 }}
                        >
                          <Option value="">Select Source</Option>
                          <Option value="Internal">Internal</Option>
                          <Option value="Eksternal">Eksternal</Option>
                        </Select>
                      );
                    }}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Frequency</label>
                  <div className="flex gap-2 ">
                    <Controller
                      control={form.control}
                      name="frequency"
                      render={({ field: { value, onChange } }) => (
                        <Input
                          required
                          value={value ?? ''}
                          onChange={(e) => onChange(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                          placeholder="Type something.."
                        />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <Select
                          className="w-1/2"
                          placeholder="Choose one.."
                          slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                          value={field.value || ''} // Pastikan tidak undefined
                          onChange={(_, newValue) => field.onChange(newValue || '')} // Tangani null
                        >
                          <Option value="Week">Week</Option>
                          <Option value="Month">Month</Option>
                          <Option value="Year">Year</Option>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Degree Usages</label>
                  <Controller
                    control={form.control}
                    name="degree_usage"
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
                  <label className="block font-medium mb-1">Calibration Date</label>
                  <Controller
                    control={form.control}
                    name="calibration_date"
                    render={({ field: { value, onChange } }) => {
                      const formattedDate = value
                        ? new Date(value).toISOString().split('T')[0]
                        : '';

                      return (
                        <input
                          type="date"
                          value={formattedDate ?? ''}
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
                    name="next_calibration"
                    render={({ field: { value, onChange } }) => {
                      const formattedDate = value
                        ? new Date(value).toISOString().split('T')[0]
                        : '';

                      return (
                        <input
                          type="date"
                          value={formattedDate}
                          onChange={(e) => onChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                        />
                      );
                    }}
                  />
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block font-medium mb-1">Ref. Criteria</label>
                  <Controller
                    control={form.control}
                    name="ref_criteria"
                    render={({ field: { value, onChange } }) => (
                      <Input
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                        placeholder="Type something.."
                      />
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Lampiran</label>
                  <div className="flex gap-2">
                    <Controller
                      control={form.control}
                      name="lampiran"
                      render={({ field: { value } }) => (
                        <Input
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Pilih file..."
                          value={selectedFile ? selectedFile.name : value?.split('/').pop() || ''}
                          disabled
                        />
                      )}
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
    </>
  );
};
