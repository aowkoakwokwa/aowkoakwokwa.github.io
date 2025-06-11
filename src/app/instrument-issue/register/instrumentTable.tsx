'use client';

import { Checkbox, Input, Table } from '@mui/joy';
import TablePagination from '@mui/material/TablePagination';
import { getInstrumentData } from '@/lib/getData';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useInstrumentStore, useUserStore } from '@/../store/store';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';

interface DecodedToken {
  image: string;
  hak_akses: string;
  level: string;
  username: string;
}
export default function InstrumentTable({ reload }: any) {
  const { selectedId, setSelectedId } = useInstrumentStore();
  const [filterStatus, setFilterStatus] = useState<'inuse' | 'period'>('inuse');
  const [monthFilter, setMonthFilter] = useState('');
  const userLevel = useUserStore((state) => state.userLevel);

  const {
    data = [],
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['getInstrumentData'],
    queryFn: getInstrumentData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (reload) {
      refetch();
    }
  }, [reload]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(13);
  const [previewImage, setPreviewImage] = useState<{ issued?: string; returned?: string } | null>(
    null,
  );

  const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 13));
    setPage(0);
  };

  const sortedData = [...data].sort(
    (a, b) => dayjs(b.tgl_diterima).valueOf() - dayjs(a.tgl_diterima).valueOf(),
  );

  const filteredData = sortedData.filter((item: any) => {
    if (filterStatus === 'inuse') {
      return item.status === 'Belum_Kembali';
    } else if (filterStatus === 'period' && monthFilter) {
      const itemDate = dayjs(item.tgl_diterima);
      const filterDate = dayjs(monthFilter);
      return itemDate.year() === filterDate.year() && itemDate.month() === filterDate.month();
    }
    return true;
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="w-full">
      <div className="w-full flex flex-row justify-between my-4">
        <div className="flex flex-row gap-4 justify-center items-center">
          <label htmlFor="inuse" className="flex gap-x-1">
            <input
              type="radio"
              name="filterStatus"
              id="inuse"
              checked={filterStatus === 'inuse'}
              onChange={() => setFilterStatus('inuse')}
            />
            In Use
          </label>
          <div className="flex items-center gap-4">
            <label htmlFor="period" className="flex gap-x-1">
              <input
                type="radio"
                name="filterStatus"
                id="period"
                checked={filterStatus === 'period'}
                onChange={() => setFilterStatus('period')}
              />
              Period
            </label>
            <Input
              disabled={filterStatus !== 'period'}
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Input placeholder="Search" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[1000px] table-auto">
          <thead>
            <tr>
              {userLevel === 'Admin' && <th className="w-[40px]"></th>}
              <th className="w-[150px]">No</th>
              <th className="w-[200px]">Nama/Operator</th>
              <th className="w-[150px]">Departemen</th>
              <th className="w-[200px]">Work Refer To</th>
              <th className="w-[100px]">Batch Qty</th>
              <th className="w-[150px]">Location</th>
              <th className="w-[160px]">Issued Date</th>
              <th className="w-[150px]">Issued By</th>
              <th className="w-[150px]">Returned By</th>
              <th className="w-[150px]">User Return</th>
              <th className="w-[150px]">Returned</th>
              <th className="w-[150px]">Status</th>
              <th className="w-[150px]">Est. Return</th>
              <th className="w-[150px]">Image</th>
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              <tr>
                <td colSpan={15} className="text-center py-8">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-5 h-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item: any) => (
                <tr key={item.usage_no}>
                  {userLevel === 'Admin' && (
                    <td>
                      <Checkbox
                        checked={selectedId === item.usage_no}
                        onChange={() =>
                          setSelectedId(selectedId === item.usage_no ? null : item.usage_no)
                        }
                      />
                    </td>
                  )}
                  <td>{item.usage_no}</td>
                  <td>{`${item.no_payroll} - ${item.nama}`}</td>
                  <td>{item.dept}</td>
                  <td className="truncate max-w-[200px]">{item.wo_refer_to}</td>
                  <td>{item.batch_qty}</td>
                  <td>{item.location}</td>
                  <td>{dayjs(item.tgl_diterima).format('MM/DD/YYYY HH:mm')}</td>
                  <td>{item.issued_by}</td>
                  <td>{item.return_by}</td>
                  <td>{item.user_return}</td>
                  <td>
                    {item.tgl_kembali ? dayjs(item.tgl_kembali).format('MM/DD/YYYY HH:mm') : '-'}
                  </td>
                  <td>{item.status}</td>
                  <td>{dayjs(item.est_return_date).format('MM/DD/YYYY HH:mm')}</td>
                  <td className="flex flex-col gap-2">
                    <a
                      className="text-blue-500 underline cursor-pointer"
                      onClick={() =>
                        setPreviewImage({ issued: item.image, returned: item.image_return })
                      }
                    >
                      Lihat
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={14} className="text-center py-4">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="w-[90%] max-w-[800px] h-[600px] bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Swiper
              modules={[Pagination]}
              pagination={{ clickable: true, dynamicBullets: true }}
              className="w-full h-full"
            >
              <SwiperSlide className="relative">
                <img
                  src={previewImage.issued || 'No Issued Image'}
                  alt="Issued"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-0 bg-gradient-to-b from-transparent to-black text-white text-center p-4 w-full font-semibold text-lg">
                  Issued By
                </div>
              </SwiperSlide>
              <SwiperSlide className="relative">
                {previewImage.returned ? (
                  <img
                    src={previewImage.returned || 'No Returned Image'}
                    alt="Returned"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-gray-500">
                    No Returned Image
                  </div>
                )}
                <div className="absolute bottom-0 bg-gradient-to-b from-transparent to-black text-white text-center p-4 w-full font-semibold text-lg">
                  Returned By
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[13]}
        />
      </div>
    </div>
  );
}
