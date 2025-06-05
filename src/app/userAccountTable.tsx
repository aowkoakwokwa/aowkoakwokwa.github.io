import { getUserAccount } from '@/lib/getData';
import { Checkbox, Table, Skeleton, Avatar } from '@mui/joy';
import {
  DialogContent,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useCheckedAccount } from '../../store/store';
import { useState } from 'react';

interface User {
  id: number;
  username: string | null;
  password: string | null;
  hak_akses: string | null;
  user_level: string | null;
  departemen: string | null;
  pc_name?: string | null;
  peminjaman?: number | null;
  image?: string | null;
}

export default function UserAccountTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const { checkedAccountRows, toggleAccountCheck } = useCheckedAccount();

  const { data, isLoading, isFetching } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['getUserAccount', page, rowsPerPage],
    queryFn: () => getUserAccount(page + 1, rowsPerPage),
    refetchOnWindowFocus: false,
  });

  const users = data?.users || [];
  const totalData = data?.total || 0;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <DialogContent sx={{ maxHeight: 450, overflowY: 'auto', px: 4, pt: 0 }}>
      {isLoading || isFetching ? (
        <>
          <Table borderAxis="xBetween">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Password</TableCell>
                <TableCell>Hak Akses</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Dept</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: Math.min(totalData, rowsPerPage) }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell style={{ paddingLeft: 0 }}>
                    <Skeleton variant="rectangular" width={24} height={24} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={50} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={50} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={50} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={50} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={50} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 2 }} />
        </>
      ) : (
        <>
          <Table borderAxis="xBetween">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Image</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Password</TableCell>
                <TableCell>Hak Akses</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Dept</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell style={{ paddingLeft: 0 }}>
                    <Checkbox
                      checked={!!checkedAccountRows[user.id]}
                      onChange={() => toggleAccountCheck(user.id, user)}
                    />
                  </TableCell>
                  <TableCell>{user.image ? <Avatar src={user.image} /> : <Avatar />}</TableCell>
                  <TableCell
                    title={user.username ?? undefined}
                    className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis"
                  >
                    {user.username}
                  </TableCell>
                  <TableCell
                    title={user.password ?? undefined}
                    className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis"
                  >
                    {user.password}
                  </TableCell>
                  <TableCell
                    title={user.hak_akses ?? undefined}
                    className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis"
                  >
                    {user.hak_akses}
                  </TableCell>
                  <TableCell
                    title={user.user_level ?? undefined}
                    className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis"
                  >
                    {user.user_level}
                  </TableCell>
                  <TableCell
                    title={user.departemen ?? undefined}
                    className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis"
                  >
                    {user.departemen}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalData}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[3]}
          />
        </>
      )}
    </DialogContent>
  );
}
