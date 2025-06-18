'use client';

import { getInstrumentDataDetail, getMaster, getNonMaster } from '@/lib/getData';
import { Checkbox, Table } from '@mui/joy';
import { useQuery } from '@tanstack/react-query';
import { useInstrumentStore, useCheckedInstrumentStore } from '@/../store/store';
import { useEffect } from 'react';

export default function InstrumentListTable() {
  const selectedId = useInstrumentStore((state) => state.selectedItem);
  const checkedMap = useCheckedInstrumentStore((state) => state.checkedInstrumentMap);
  const setCheckedData = useCheckedInstrumentStore((state) => state.setCheckedInstrumentList);
  const updateCheckedInstrument = useCheckedInstrumentStore(
    (state) => state.updateCheckedInstrument,
  );

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

  useEffect(() => {
    if (!selectedId) return;
    const initialState = data.map((item) => ({
      id: String(item.id),
      return: item.kembali === 'Ya',
      good: item.kondisi === 'Baik',
      nc: item.kondisi2 === 'NC',
    }));

    const isEqual = JSON.stringify(initialState) === JSON.stringify(checkedData);
    if (!isEqual) {
      setCheckedData(String(selectedId?.usage_no), initialState);
    }
  }, [data, selectedId]);

  const handleCheckboxChange = (index: number, field: 'return' | 'good' | 'nc') => {
    if (selectedId) {
      const currentValue = checkedData[index]?.[field] || false;
      updateCheckedInstrument(String(selectedId?.usage_no), index, field, !currentValue);
    }
  };

  return (
    <div>
      <Table>
        <thead>
          <tr>
            <th>JFT No</th>
            <th>Description</th>
            <th>Size</th>
            <th>Serial Number</th>
            <th>Return</th>
            <th>Good</th>
            <th>NC</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
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
                <td>
                  <Checkbox
                    checked={checkedData[index]?.return || false}
                    onChange={() => handleCheckboxChange(index, 'return')}
                  />
                </td>
                <td>
                  <Checkbox
                    checked={checkedData[index]?.good || false}
                    onChange={() => handleCheckboxChange(index, 'good')}
                  />
                </td>
                <td>
                  <Checkbox
                    checked={checkedData[index]?.nc || false}
                    onChange={() => handleCheckboxChange(index, 'nc')}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
