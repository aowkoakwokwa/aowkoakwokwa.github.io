'use client';

import React, { useState } from 'react';
import { getNCR } from '@/lib/getData';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@mui/joy';
import { AddOutlined, CreateOutlined, RefreshOutlined } from '@mui/icons-material';
import EntryNCRTable from './entryNcrTable';
import { useCheckedStore, useUserStore } from '../../../../store/store';
import EntryNCRForm from './entryNcrForm';
import { Trash2 } from 'lucide-react';
import { deleteNcr } from '@/lib/deleteData';

export default function EntryNCR() {
  const { checkedRows, toggleCheck } = useCheckedStore();
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const userLevel = useUserStore((state) => state.userLevel);

  const {
    data: masterData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['getNCR'],
    queryFn: getNCR,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async (data?: string) => {
      return await deleteNcr(data);
    },
    onError: (err) => console.error(err),
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = () => {
    const selectedNcrNo = Object.keys(checkedRows).find((ncr_no) => checkedRows[ncr_no]);
    if (selectedNcrNo) {
      mutation.mutate(selectedNcrNo);
      toggleCheck(null, true);
    }
  };

  if (isLoading) return <>Loading...</>;

  return (
    <>
      <div className="bg-white shadow-md rounded-xl p-4">
        <div className="flex gap-4">
          <div className="flex gap-4">
            <Button
              color="success"
              startDecorator={<AddOutlined />}
              sx={{ paddingY: 1.2 }}
              onClick={() => setOpenForm(true)}
              disabled={Object.values(checkedRows).some((value) => value) || userLevel !== 'Admin'}
            >
              Tambah
            </Button>
            <Button
              color="primary"
              startDecorator={<RefreshOutlined />}
              sx={{ paddingY: 1.2 }}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
          {Object.values(checkedRows).some((value) => value) && (
            <div className="flex gap-4">
              <Button
                color="primary"
                startDecorator={<CreateOutlined />}
                sx={{ paddingY: 1.2 }}
                onClick={() => {
                  setOpenForm(true);
                  setIsEdit(true);
                }}
              >
                Edit
              </Button>
              <Button
                color="danger"
                startDecorator={<Trash2 />}
                sx={{ paddingY: 1.2 }}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
        {masterData && (
          <div>
            {!isFetching && (
              <EntryNCRTable
                data={masterData.map((entry) => ({
                  ...entry,
                  ncr_no: entry.ncr_no ?? '',
                  source: entry.source ?? '',
                  item: entry.item ?? '',
                  description: entry.description ?? '',
                  po_no: entry.po_no ?? '',
                  wo_no: entry.wo_no ?? '',
                  batch_qty: entry.batch_qty ?? 0,
                  case: entry.case ?? '',
                  pcs: entry.pcs ?? 0,
                  kg: entry.kg ?? 0,
                  issued_date: entry.issued_date ? entry.issued_date.toISOString() : '',
                  completion_date: entry.completion_date ? entry.completion_date.toISOString() : '',
                  verified_date: entry.verified_date ? entry.verified_date.toISOString() : '',
                  fault: entry.fault ?? '',
                  departement: entry.departement ?? '',
                }))}
              />
            )}
          </div>
        )}
      </div>
      <EntryNCRForm
        open={openForm}
        close={() => {
          setOpenForm(false);
          setIsEdit(false);
        }}
        id={Object.keys(checkedRows).find((ncr_no) => checkedRows[ncr_no]) || ''}
        isEdit={isEdit}
      />
    </>
  );
}
