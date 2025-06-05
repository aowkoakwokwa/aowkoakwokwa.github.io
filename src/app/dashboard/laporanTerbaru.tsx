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
  Box,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

export default function LaporanTerbaru() {
  const {
    data: masterBarang,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['getMaster'],
    queryFn: getMaster,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (isError) return <Typography>Error loading data</Typography>;

  const sortedData = masterBarang
    ? [...masterBarang].sort(
        (a, b) => new Date(b.create_at).getTime() - new Date(a.create_at).getTime(),
      )
    : [];

  const dataToShow = sortedData.slice(0, 4);

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
            {dataToShow.map((row: any, index: number) => (
              <TableRow key={row.no_jft || index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.no_jft}</TableCell>
                <TableCell>{dayjs(row.calibration_date).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{dayjs(row.next_calibration).format('YYYY-MM-DD')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="flex-start" alignItems="center" padding={2}>
        <Typography variant="body2" color="text.secondary">
          Laporan Terbaru Master Kalibrasi
        </Typography>
      </Box>
    </Paper>
  );
}
