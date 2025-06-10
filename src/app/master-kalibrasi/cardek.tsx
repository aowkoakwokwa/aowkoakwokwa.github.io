'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  TablePagination,
  Tooltip,
} from '@mui/material';
import { Button, Checkbox, Table } from '@mui/joy';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCardek } from '@/lib/getData';
import { deleteCardek } from '@/lib/deleteData';
import dayjs from 'dayjs';
import { CirclePlus, Printer, RefreshCcw, Trash2 } from 'lucide-react';
import ManualCardek from './manualCardek';
import CalibrationRecordPDF from './cardekPrint';
import { pdf } from '@react-pdf/renderer';

interface CalibrationRecord {
  jft_no: string;
  desc: string;
  cal_date: string;
  next_cal_date: string;
  frequency: string;
  source: string;
  inspection_no: string;
  cert_no?: string;
  accept_criteria: string;
  location: string;
  signature: string;
}

export default function Cardek({
  open,
  close,
  dataCardeck,
}: {
  open: boolean;
  close: () => void;
  dataCardeck: any;
}) {
  const { data: masterData, refetch } = useQuery({
    queryKey: ['getCardek'],
    queryFn: getCardek,
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await deleteCardek(id),
    onSuccess: () => {
      refetch();
      setSelectedItem(null);
    },
  });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [openCardek, setOpenCardek] = useState(false);
  const jft_no = dataCardeck?.[1] ?? '-';
  const calFreq = dataCardeck?.[2] ?? '-';
  const calSource = dataCardeck?.[3] ?? '-';
  const acceptCriteria = dataCardeck?.[4] ?? '-';
  const desc = dataCardeck?.[5] ?? '-';
  const [printData, setPrintData] = useState<CalibrationRecord[]>([]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const calculateNextCalibration = (calDate: string, frequency: string) => {
    if (!calDate || !frequency) return '-';
    const date = dayjs(calDate);
    const match = frequency.match(/(\d+)\s*(Week|Weeks|Year|Years|Month|Months)/i);
    if (!match) return '-';
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case 'week':
      case 'weeks':
        return date.add(amount, 'week').format('DD/MM/YYYY');
      case 'month':
      case 'months':
        return date.add(amount, 'month').format('DD/MM/YYYY');
      case 'year':
      case 'years':
        return date.add(amount, 'year').format('DD/MM/YYYY');
      default:
        return '-';
    }
  };

  const handlePrint = async () => {
    const blob = await pdf(<CalibrationRecordPDF data={printData} />).toBlob();
    const url = URL.createObjectURL(blob);

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Print Preview</title></head>
          <body style="margin:0;">
            <iframe src="${url}" style="width:100%; height:100vh; border:none;"></iframe>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedItem((prev) => (prev === id ? null : id));
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    deleteMutation.mutate(selectedItem);
  };

  const filteredData = masterData?.filter((item: any) => item.jft_no === jft_no) || [];
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    if (filteredData.length > 0) {
      const formatted = filteredData.map((row: any) => ({
        jft_no: jft_no,
        desc: desc,
        cal_date: row.cal_date ? dayjs(row.cal_date).format('DD/MM/YYYY') : '-',
        next_cal_date: row.cal_date ? calculateNextCalibration(String(row.cal_date), calFreq) : '-',
        frequency: calFreq || '-',
        source: calSource || '-',
        inspection_no: row.rept_no || '-',
        cert_no: row.cert_no || '-',
        accept_criteria: acceptCriteria || '-',
        location: row.cal_location || '-',
        signature: row.cal_name || '-',
      }));
      const isSame = JSON.stringify(printData) === JSON.stringify(formatted);
      if (!isSame) {
        setPrintData(formatted);
      }
    }
  }, [filteredData, calFreq, calSource, acceptCriteria, desc]);

  return (
    <>
      <Dialog open={open} onClose={close} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Cardek Details</DialogTitle>
        <DialogContent sx={{ padding: 2, pb: 0 }}>
          {filteredData.length > 0 ? (
            <>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ fontWeight: 'bold' }}>Cal. Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Next Cal. Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Freq.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rept. No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Accept Criteria</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cal. Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Lampiran</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row: any, index: number) => {
                    const nextCalDate = calculateNextCalibration(row.cal_date, calFreq);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItem === row.id}
                            onChange={() => handleCheckboxChange(row.id)}
                          />
                        </TableCell>
                        <TableCell className="overflow-x-auto truncate">
                          {dayjs(row.cal_date).format('DD/MM/YYYY')}
                        </TableCell>
                        <TableCell className="overflow-x-auto truncate">{nextCalDate}</TableCell>
                        <TableCell className="overflow-x-auto truncate">{calFreq}</TableCell>
                        <TableCell className="overflow-x-auto truncate">{calSource}</TableCell>
                        <TableCell className="overflow-x-auto truncate">
                          {row.rept_no || '-'}
                        </TableCell>
                        <TableCell className="overflow-x-auto truncate">{acceptCriteria}</TableCell>
                        <TableCell className="overflow-x-auto truncate">
                          {row.cal_location || '-'}
                        </TableCell>
                        <TableCell className="overflow-x-auto truncate">
                          {row.cal_name || '-'}
                        </TableCell>
                        <TableCell className="overflow-x-auto truncate">
                          <a
                            className="underline text-blue-500"
                            href={row.lampiran || '-'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                rowsPerPageOptions={[5, 10]}
                count={filteredData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          ) : (
            <Typography align="center" sx={{ marginTop: 2, fontStyle: 'italic' }}>
              No matching data found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Tooltip title="Manual Add Cardek">
            <Button
              startDecorator={<CirclePlus />}
              onClick={() => setOpenCardek(true)}
              color="success"
            >
              Manual Cardek
            </Button>
          </Tooltip>
          <Button startDecorator={<RefreshCcw />} onClick={() => refetch()}>
            Refresh
          </Button>
          {selectedItem && (
            <Button color="danger" startDecorator={<Trash2 />} onClick={handleDelete}>
              Delete Selected
            </Button>
          )}
          <Button
            onClick={handlePrint}
            color="warning"
            disabled={printData.length === 0}
            startDecorator={<Printer />}
          >
            Preview Print
          </Button>
        </DialogActions>
      </Dialog>
      <ManualCardek open={openCardek} close={() => setOpenCardek(false)} />
    </>
  );
}
