'use client';

import { getInstrumentDataDetail, getMaster, getNonMaster } from '@/lib/getData';
import { Table } from '@mui/joy';
import { useQuery } from '@tanstack/react-query';
import { useInstrumentStore, useCheckedInstrumentStore } from '@/../store/store';

export default function InstrumentListTable() {
  const selectedId = useInstrumentStore((state) => state.selectedItem);
  const checkedMap = useCheckedInstrumentStore((state) => state.checkedInstrumentMap);

  const { data = [] } = useQuery({
    queryKey: ['getInstrumentDataDetail', selectedId?.usage_no],
    queryFn: () => getInstrumentDataDetail(selectedId?.usage_no),
    enabled: !!selectedId?.usage_no,
  });

  const { data: masterData = [] } = useQuery({
    queryKey: ['getMaster'],
    queryFn: getMaster,
    refetchOnWindowFocus: false,
  });

  const { data: masterNonData = [] } = useQuery({
    queryKey: ['getNonMaster'],
    queryFn: getNonMaster,
    refetchOnWindowFocus: false,
  });

  const checkedData = checkedMap[selectedId?.usage_no ?? ''] || [];

  return (
    <div>
      <Table>
        <thead>
          <tr>
            <th>JFT No</th>
            <th>Description</th>
            <th>Size</th>
            <th>Serial Number</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isReturned = item.kembali === 'Ya';
            const isDeletedMaster = masterData.find((m) => m.no_jft === item.jft_no)?.deleted === 1;
            const isDeletedNonMaster =
              masterNonData.find((nm) => nm.no_jft === item.jft_no)?.deleted === 1;
            const isDeleted = isDeletedMaster || isDeletedNonMaster;

            const textClass = [
              isReturned ? 'text-gray-400 italic' : '',
              isDeleted ? 'line-through text-red-500' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <tr key={item.id}>
                <td className={textClass}>{item.jft_no}</td>
                <td className={textClass}>{item.description}</td>
                <td className={textClass}>{item.size}</td>
                <td className={textClass}>{item.serial_number}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
