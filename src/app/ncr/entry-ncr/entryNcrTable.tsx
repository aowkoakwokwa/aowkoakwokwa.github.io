import { TableBody, TableCell, TableHead, TablePagination, TableRow } from '@mui/material';
import { Table, Checkbox, Select, Option } from '@mui/joy';
import { useCheckedStore, useUserStore } from '../../../../store/store';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import React from 'react';

interface EntryNcrFormProps {
  ncr_no: string;
  source: string;
  item: string;
  description: string;
  po_no: string;
  wo_no: string;
  batch_qty: number;
  case: string;
  pcs: number;
  kg: number;
  issued_date: string | Date;
  completion_date: string | Date;
  verified_date: string | Date;
  fault: string;
  departement: string;
  lampiran: string;
}

interface EntryNCRTableProps {
  data?: EntryNcrFormProps[];
}

export default function EntryNCRTable({ data = [] }: EntryNCRTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(13);
  const [selectedDept, setSelectedDept] = useState('Semua');
  const { checkedRows, toggleCheck } = useCheckedStore();
  const [showNoData, setShowNoData] = useState(false);
  const userLevel = useUserStore((state) => state.userLevel);
  const [checked, setChecked] = React.useState(false);

  const formatDate = (date: string | Date) => {
    if (!date || date === '-') return '-';
    if (typeof date === 'string') {
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        return new Date(`${year}-${month}-${day}`).toLocaleDateString();
      }
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const filteredData = data.filter((entry) => {
    const byDept = selectedDept === 'Semua' || entry.departement === selectedDept;
    const byDisposition = !checked || entry.case === 'Dash';
    return byDept && byDisposition;
  });

  useEffect(() => {
    if (filteredData.length === 0) {
      const timer = setTimeout(() => {
        setShowNoData(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowNoData(false);
    }
  }, [filteredData]);

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const mapCaseEnumToLabel = (value: string): string => {
    switch (value) {
      case 'Dash':
        return '-';
      case 'Return_To_Supplier':
        return 'Return To Supplier';
      case 'Repair_Rework':
        return 'Repair/Rework';
      case 'Re_grade':
        return 'Re-grade';
      case 'Accept_As_Is':
        return 'Accept As Is';
      default:
        return value;
    }
  };

  return (
    <>
      <div className="flex w-full justify-between items-center border-b-2 border-gray-200">
        <div className="flex gap-2 py-4  items-center">
          <span className="text-black">NCR Source Dept</span>
          <Select value={selectedDept} onChange={(_, value) => setSelectedDept(value ?? 'Semua')}>
            <Option value="Semua">Semua</Option>
            <Option value="CNC">CNC</Option>
            <Option value="Assembly">Assembly</Option>
            <Option value="SCP">SCP</Option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            color="primary"
            label="Disposition"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
        </div>
      </div>

      <Table aria-label="Entry NCR Table">
        <TableHead>
          <TableRow>
            {[
              '',
              'NCR No.',
              'Source Of NCR',
              'Item',
              'Description',
              'P/O No.',
              'W/O No.',
              'Batch No.',
              'Case',
              'Pcs',
              'Kg',
              'Issued Date',
              'Completion Date',
              'Verified Date',
              'Fault Code',
              'Departement',
              'Lampiran',
            ].map((header, index) => {
              if (index === 0 && userLevel !== 'Admin') return null;
              return (
                <TableCell
                  key={index}
                  className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis"
                  title={header}
                >
                  {header}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={16} className="text-center">
                {showNoData ? (
                  'No Data Available'
                ) : (
                  <div className="flex justify-center items-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"
                    />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((entry) => (
              <TableRow key={entry.ncr_no}>
                {userLevel === 'Admin' && (
                  <TableCell>
                    <Checkbox
                      checked={checkedRows[entry.ncr_no] || false}
                      onChange={() => toggleCheck(entry.ncr_no)}
                    />
                  </TableCell>
                )}
                {[
                  entry.ncr_no,
                  entry.source === 'ExStock' ? 'Ex-Stock' : entry.source,
                  entry.item,
                  entry.description,
                  entry.po_no,
                  entry.wo_no,
                  entry.batch_qty,
                  mapCaseEnumToLabel(entry.case),
                  entry.pcs,
                  entry.kg,
                  formatDate(entry.issued_date),
                  formatDate(entry.completion_date),
                  formatDate(entry.verified_date),
                  entry.fault,
                  entry.departement,
                  entry.lampiran,
                ].map((value, idx) => (
                  <TableCell
                    key={idx}
                    className="max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis"
                    title={value as string}
                  >
                    {idx === 15 && value ? (
                      <a
                        href={value as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        Lihat
                      </a>
                    ) : (
                      value
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={16} className="text-center">
                No Data Available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        rowsPerPageOptions={[5, 10, 13]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
}
