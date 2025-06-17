'use client';

import { getInstrumentDataDetail, getMaster } from '@/lib/getData';
import { Table } from '@mui/joy';
import { useQuery } from '@tanstack/react-query';
import { useInstrumentStore, useCheckedInstrumentStore } from '@/../store/store';

export default function InstrumentListTable() {
  const selectedId = useInstrumentStore((state) => state.selectedId);
  const checkedMap = useCheckedInstrumentStore((state) => state.checkedInstrumentMap);

  const { data = [] } = useQuery({
    queryKey: ['getInstrumentDataDetail', selectedId],
    queryFn: () => getInstrumentDataDetail(selectedId),
    enabled: !!selectedId,
  });

  const { data: masterData = [] } = useQuery({
    queryKey: ['getMaster'],
    queryFn: getMaster,
    refetchOnWindowFocus: false,
  });

  const checkedData = checkedMap[selectedId ?? ''] || [];

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
          {data.map((item, index) => {
            const isReturned = item.kembali === 'Ya';
            console.log(isReturned);
            console.log(data);
            const master = masterData.find((m) => m.no_jft === item.jft_no);
            const isDeleted = master?.deleted === 1;

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
