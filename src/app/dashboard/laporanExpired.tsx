'use client';

import { getMaster } from '@/lib/getData';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function LaporanExpired() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(4);

  const { data: masterBarang, isLoading } = useQuery({
    queryKey: ['getMaster'],
    queryFn: getMaster,
    refetchOnWindowFocus: false,
  });

  const today = dayjs();
  const filteredData = (masterBarang || []).filter((item: any) => {
    const nextCalibration = dayjs(item.next_calibration);
    const diff = nextCalibration.diff(today, 'day');
    return diff >= 0 && diff <= 7;
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        width: '100%',
        overflow: 'hidden',
        mt: 2,
        borderRadius: '8px',
        boxShadow: '0px 4px 8px 0px rgba(0,0,0,0.18)',
      }}
    >
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Jft No</TableCell>
              <TableCell>Calibration Date</TableCell>
              <TableCell>Next Calibration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Tidak ada data kalibrasi yang akan expired.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row: any, index: number) => (
                    <TableRow key={row.id || index}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{row.no_jft}</TableCell>
                      <TableCell>{dayjs(row.calibration_date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{dayjs(row.next_calibration).format('YYYY-MM-DD')}</TableCell>
                    </TableRow>
                  ))}
                {Array.from({
                  length:
                    rowsPerPage -
                    filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length,
                }).map((_, index) => (
                  <TableRow key={`empty-${index}`}>
                    <TableCell colSpan={4} style={{ height: 53 }} />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" paddingX={2}>
        <Typography variant="body2" color="text.secondary">
          Jadwal Kalibrasi Mendatang
        </Typography>
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[4]}
        />
      </Box>
    </Paper>
  );
}
