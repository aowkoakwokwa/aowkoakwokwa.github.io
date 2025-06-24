'use client';

import { getMaster, getNCR } from '@/lib/getData';
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

export default function LaporanTerbaruNcr() {
  const {
    data: data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['getNCR'],
    queryFn: getNCR,
    refetchOnWindowFocus: false,
  });

  console.log(data);

  if (isLoading) return <Typography>Loading...</Typography>;
  if (isError) return <Typography>Error loading data</Typography>;

  const sortedData = data
    ? [...data].sort((a, b) => {
        const dateA = a.create_at ? new Date(a.create_at).getTime() : 0;
        const dateB = b.create_at ? new Date(b.create_at).getTime() : 0;
        return dateB - dateA;
      })
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
              <TableCell>Item</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataToShow.map((row: any, index: number) => (
              <TableRow key={row.ncr_no || index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{row.ncr_no}</TableCell>
                <TableCell>{row.item}</TableCell>
                <TableCell>{row.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="flex-start" alignItems="center" padding={2}>
        <Typography variant="body2" color="text.secondary">
          Laporan Terbaru NCR
        </Typography>
      </Box>
    </Paper>
  );
}
