import { Skeleton, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const SkeletonLoader = () => {
  return (
    <Box width="100%" padding={2}>
      {/* Tombol Skeleton */}
      <Box display="flex" gap={1} marginBottom={2}>
        <Skeleton variant="rectangular" width={80} height={36} />
        <Skeleton variant="rectangular" width={80} height={36} />
        <Skeleton variant="rectangular" width={80} height={36} />
      </Box>

      {/* Tabel Skeleton */}
      <Skeleton variant="rectangular" width="100%" height={40} animation="wave" />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Skeleton variant="text" width="80%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width="60%" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width="70%" />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton variant="text" width="80%" />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width="60%" />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width="70%" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default SkeletonLoader;
