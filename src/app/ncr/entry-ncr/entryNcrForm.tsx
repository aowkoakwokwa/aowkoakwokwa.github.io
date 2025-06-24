'use client';

import { CancelOutlined, SaveAltOutlined } from '@mui/icons-material';
import { Input, Select, Button, Option, Textarea, Checkbox, Tooltip } from '@mui/joy';
import { Dialog, DialogActions, DialogTitle, DialogContent } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import SelectWithCheckbox from './selectWithCheckbox';
import NcrComponent from './generateNcrNo';
import { getNCRById } from '@/lib/getData';
import { useMutation } from '@tanstack/react-query';
import { insertNcrData } from '@/lib/insertData';
import { editNcrData } from '@/lib/editData';
import { useCheckedStore, useUserStore } from '../../../../store/store';

interface EntryNcrFormProps {
  open: boolean;
  id: string | null;
  close: () => void;
  isEdit: boolean;
}

type FormValues = {
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
  issued_date: Date;
  completion_date: Date | null;
  verified_date: Date | null;
  fault: string;
  departement: string;
  cv: string;
  remarks: string;
  lampiran: string;
};

export default function EntryNCRForm({ open, close, id, isEdit }: EntryNcrFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    defaultValues: {
      ncr_no: '',
      source: '',
      item: '',
      description: '',
      po_no: '',
      wo_no: '',
      batch_qty: 0,
      case: 'Dash',
      pcs: 0,
      kg: 0,
      issued_date: new Date(),
      completion_date: null,
      verified_date: null,
      fault: '',
      departement: '',
      cv: '',
      remarks: '',
      lampiran: '',
    },
  });
  const watchSource = form.watch('source');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cv, setCv] = useState('No');
  const { toggleCheck } = useCheckedStore();
  const userData = useUserStore((state) => state.userData);

  const { data, refetch } = useQuery({
    queryKey: ['getNCRById', id],
    queryFn: async () => {
      if (!id) return null;
      return await getNCRById(id);
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const defaultValues = {
    ncr_no: '',
    source: '',
    item: '',
    description: '',
    po_no: '',
    wo_no: '',
    batch_qty: 0,
    case: 'Dash',
    pcs: 0,
    kg: 0,
    issued_date: new Date(),
    completion_date: null,
    verified_date: null,
    fault: '',
    departement: '',
    cv: '',
    remarks: '',
    lampiran: '',
  };

  const mutation = useMutation({
    mutationFn: async (formData) => {
      return isEdit ? await editNcrData(formData) : await insertNcrData(formData);
    },

    onError: (error) => {
      console.error('Error processing request:', error);
    },
    onSuccess: () => {
      close();
      toggleCheck(null, true);
      setSelectedDept('');
      setCv('No');
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ['getNCR'] });
    },
  });

  const onSubmit = async (formData: any) => {
    try {
      let lampiranPath = formData.lampiran || '';

      if (!isEdit || (isEdit && selectedFile)) {
        const formDataUpload = new FormData();
        formDataUpload.append('lampiran', selectedFile as File);

        const uploadResponse = await fetch('/api/upload/ncr', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }

        const fileData = await uploadResponse.json();
        lampiranPath = `https://aowkoakwokwa.github.io/public/lampiran/ncr/${fileData.fileName}`;
      }

      const formattedData = {
        ...formData,
        issued_date: formData.issued_date ? new Date(formData.issued_date) : null,
        completion_date: formData.completion_date ? new Date(formData.completion_date) : null,
        verified_date: formData.verified_date ? new Date(formData.verified_date) : null,
        lampiran: lampiranPath,
        users: userData?.username,
        cv: cv,
      };

      if (!formattedData || Object.keys(formattedData).length === 0) {
        console.error('Data yang dikirim kosong atau null!');
        return;
      }

      mutation.mutate(formattedData);
      setSelectedFile(null);
      refetch();
    } catch (error) {
      console.error('Error processing request:', error);
    }
  };

  useEffect(() => {
    if (!id) {
      form.reset();
      setCv('No');
      return;
    }

    if (data) {
      form.setValue('ncr_no', data.ncr_no ?? '');
      form.setValue('source', data.source ?? '');
      form.setValue('item', data.item ?? '');
      form.setValue('description', data.description ?? '');
      form.setValue('po_no', data.po_no ?? '');
      form.setValue('wo_no', data.wo_no ?? '');
      form.setValue('batch_qty', data.batch_qty ?? 0);
      form.setValue('case', data.case ?? '-');
      form.setValue('pcs', data.pcs ?? 0);
      form.setValue('kg', data.kg ?? 0);
      form.setValue('issued_date', data.issued_date ? new Date(data.issued_date) : new Date());
      form.setValue(
        'completion_date',
        data.completion_date ? new Date(data.completion_date) : null,
      );
      form.setValue('verified_date', data.verified_date ? new Date(data.verified_date) : null);
      form.setValue('fault', data.fault ?? '');
      form.setValue('departement', data.departement ?? '');
      form.setValue('cv', data.cv ?? '');
      form.setValue('remarks', data.remarks ?? '');
      form.setValue('lampiran', data.lampiran ?? '');

      setCv(data.cv === 'Yes' ? 'Yes' : 'No');
    }
  }, [id, data, form]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCv(event.target.checked ? 'Yes' : 'No');
  };

  return (
    <>
      <Dialog
        open={open}
        maxWidth="xl"
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            close();
          }
        }}
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTitle>Form Entry NCR</DialogTitle>
          <DialogContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Controller
                      control={form.control}
                      name="ncr_no"
                      rules={{
                        validate: (value) => value.trim() !== '' || '',
                      }}
                      render={({ field }) => (
                        <NcrComponent
                          selectedDept={selectedDept}
                          selectedNcr={watchSource}
                          value={field.value}
                          onChange={field.onChange}
                          id={id}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Dept</label>
                    <Select
                      className="w-full"
                      placeholder="Choose one.."
                      slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                      sx={{ py: 1 }}
                      disabled={isEdit}
                      value={selectedDept || ''}
                      onChange={(e, value) => setSelectedDept(value || '')}
                    >
                      <Option value="Floating">Floating</Option>
                      <Option value="Cementing">Cementing</Option>
                    </Select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Source of NCR</label>
                  <Controller
                    name="source"
                    defaultValue=""
                    control={form.control}
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Please select a source' : ''} arrow>
                        <Select
                          className="w-full"
                          required
                          placeholder="Choose one.."
                          slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                          sx={{ py: 1 }}
                          disabled={isEdit}
                          value={value}
                          onChange={(_e, value) => onChange(value)}
                        >
                          <Option value="Supplier">Supplier</Option>
                          <Option value="Process">Process</Option>
                          <Option value="ExStock">Ex-Stock</Option>
                          <Option value="Customer">Customer</Option>
                        </Select>
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Item Description</label>
                  <Controller
                    control={form.control}
                    name="item"
                    rules={{
                      validate: (value) => value.trim() !== '' || '',
                    }}
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <Textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          minRows={2}
                          onChange={onChange}
                          value={value}
                          placeholder="Type anything.."
                        />
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Description of Non-Conformance</label>
                  <Controller
                    control={form.control}
                    name="description"
                    rules={{
                      validate: (value) => value.trim() !== '' || '',
                    }}
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <Textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          minRows={4}
                          onChange={onChange}
                          placeholder="Type anything.."
                          value={value}
                        />
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">P/O No.</label>
                  <Controller
                    control={form.control}
                    name="po_no"
                    rules={{
                      validate: (value) => value.trim() !== '' || '',
                    }}
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <Input
                          onChange={onChange}
                          required
                          value={value || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Type something.."
                        />
                      </Tooltip>
                    )}
                  />
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block font-medium mb-1">Work Order No.</label>
                  <Controller
                    control={form.control}
                    name="wo_no"
                    rules={{
                      validate: (value) => value.trim() !== '' || '',
                    }}
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <Input
                          onChange={onChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Type something.."
                          required
                          value={value || ''}
                        />
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Batch Qty.</label>
                  <Controller
                    control={form.control}
                    name="batch_qty"
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <input
                          onChange={onChange}
                          type="number"
                          min={0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Type something.."
                          required
                          value={value || ''}
                        />
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Case/NCR Status</label>
                  <Controller
                    name="case"
                    control={form.control}
                    defaultValue="-"
                    render={({ field }) => (
                      <Tooltip
                        title={!field.value || field.value === '-' ? 'Field is required' : ''}
                        arrow
                      >
                        <Select
                          className="w-full"
                          placeholder="Choose one.."
                          slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                          sx={{ py: 1 }}
                          required
                          value={field.value}
                          onChange={(_, value) => field.onChange(value)}
                        >
                          <Option value="Dash">-</Option>
                          <Option value="Return_To_Supplier">Return To Supplier</Option>
                          <Option value="Repair">Repair</Option>
                          <Option value="Rework">Rework</Option>
                          <Option value="Accept_As_Is">Accept As Is</Option>
                          <Option value="Scrap">Scrap</Option>
                        </Select>
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium mb-1">Pcs</label>
                    <Controller
                      control={form.control}
                      name="pcs"
                      render={({ field: { value, onChange } }) => (
                        <Tooltip title={!value ? 'Field is required' : ''} arrow>
                          <input
                            min={0}
                            onChange={onChange}
                            type="number"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Type something.."
                            value={value || ''}
                          />
                        </Tooltip>
                      )}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Kg</label>
                    <Controller
                      control={form.control}
                      defaultValue={0}
                      name="kg"
                      render={({ field: { value, onChange } }) => (
                        <Tooltip title={!value ? 'Field is required' : ''} arrow>
                          <input
                            min={0}
                            onChange={onChange}
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Type something.."
                            value={value}
                            {...(selectedDept === 'Floating' ? { disabled: true } : {})}
                          />
                        </Tooltip>
                      )}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Issued Date</label>
                  <Controller
                    control={form.control}
                    name="issued_date"
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <input
                          onChange={(e) => onChange(e.target.value)}
                          type="date"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                          value={value ? new Date(value).toISOString().split('T')[0] : ''}
                        />
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Completion Date</label>
                  <Controller
                    control={form.control}
                    name="completion_date"
                    render={({ field: { value, onChange } }) => (
                      <input
                        onChange={(e) => onChange(e.target.value)}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                        value={value ? new Date(value).toISOString().split('T')[0] : ''}
                      />
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Verified Date</label>
                  <Controller
                    control={form.control}
                    name="verified_date"
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-[#fbfcfe] text-gray-500"
                        value={value ? new Date(value).toISOString().split('T')[0] : ''}
                        onChange={(e) => onChange(e.target.value)}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block font-medium mb-1">Fault Code</label>
                  <SelectWithCheckbox name="fault" control={form.control} />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Lampiran</label>
                  <div className="flex gap-2">
                    <Controller
                      control={form.control}
                      name="lampiran"
                      render={({ field: { value } }) => (
                        <Tooltip title={!value ? 'Field is required' : ''} arrow>
                          <Input
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Pilih file..."
                            value={selectedFile ? selectedFile.name : ''}
                            readOnly
                          />
                        </Tooltip>
                      )}
                    />
                    <Button className="relative" variant="solid" component="label">
                      Upload
                      <div className="absolute h-0 p-0 right-32 overflow-hidden">
                        <input
                          type="file"
                          required={!isEdit}
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                        />
                      </div>
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">NCR Source DPT</label>
                  <Controller
                    name="departement"
                    control={form.control}
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <Select
                          className="w-full"
                          placeholder="Choose one.."
                          required
                          slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                          sx={{ py: 1 }}
                          value={value || ''}
                          onChange={(_, newValue) => onChange(newValue)}
                        >
                          <Option value="CNC">CNC</Option>
                          <Option value="Assembly">Assembly</Option>
                          <Option value="SCP">SCP</Option>
                        </Select>
                      </Tooltip>
                    )}
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Choke Valve</label>
                  <div className="flex items-center gap-2 ">
                    <label htmlFor="cv" className="text-gray-500 flex items-center">
                      <Checkbox
                        id="cv"
                        className="mr-2"
                        checked={cv === 'Yes'}
                        onChange={handleCheckboxChange}
                      />
                      NCR Choke Valve
                    </label>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block font-medium mb-1">Remarks</label>
                  <Controller
                    control={form.control}
                    name="remarks"
                    rules={{
                      validate: (value) => value.trim() !== '' || '',
                    }}
                    render={({ field: { value, onChange } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <Textarea
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          minRows={2}
                          onChange={onChange}
                          placeholder="Type anything.."
                          value={value || ''}
                        />
                      </Tooltip>
                    )}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button color="success" type="submit" startDecorator={<SaveAltOutlined />}>
              {isEdit ? 'Update' : 'Save'}
            </Button>
            <Button color="danger" startDecorator={<CancelOutlined />} onClick={close}>
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
