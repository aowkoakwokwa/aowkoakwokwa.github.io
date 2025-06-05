import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Autocomplete } from '@mui/joy';
import Input from '@mui/joy/Input';
import axios from 'axios';

interface OperatorData {
  payroll_id: string;
  name: string;
  departement: string;
}

const OperatorForm = ({ form }: { form: any }) => {
  const [operatorList, setOperatorList] = useState<OperatorData[]>([]);

  useEffect(() => {
    axios
      .get('/data/data.json')
      .then((res) => {
        setOperatorList(res.data);
      })
      .catch((err) => console.error('Failed to load data:', err));
  }, []);

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex flex-row gap-4">
          <label className="block font-medium mb-1 w-full">Payroll</label>
          <label className="block font-medium mb-1 w-full">Name/Operator</label>
        </div>

        <div className="flex flex-row gap-2 mb-4 w-[50%]">
          <div className="w-full">
            <Controller
              control={form.control}
              name="payroll_id_operator"
              rules={{ required: 'Payroll ID is required' }}
              render={({ field: { onChange }, fieldState: { error } }) => (
                <div className="w-[95%] h-[100%]">
                  <Autocomplete
                    options={operatorList}
                    getOptionLabel={(option) => option?.payroll_id || ''}
                    slotProps={{
                      listbox: {
                        sx: {
                          zIndex: 1300,
                          maxHeight: 122,
                          overflow: 'auto',
                        },
                      },
                    }}
                    value={
                      operatorList.find(
                        (item) => item.payroll_id === form.watch('payroll_id_operator'),
                      ) || null
                    }
                    onChange={(_, newValue) => {
                      onChange(newValue?.payroll_id || '');
                      form.setValue('payroll_name_operator', newValue?.name || '');
                      form.setValue('payroll_departement_operator', newValue?.departement || '');
                    }}
                    placeholder="Select payroll ID"
                    sx={{ width: '100%', paddingY: 0.75 }}
                  />
                  {error && <span className="text-red-600 text-sm">{error.message}</span>}
                </div>
              )}
            />
          </div>

          <div className="w-full">
            <Controller
              control={form.control}
              name="payroll_name_operator"
              rules={{ required: 'Name is required' }}
              render={({ field: { value }, fieldState: { error } }) => (
                <div className="w-[95%]">
                  <Input
                    value={value ?? ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Name auto-filled"
                  />
                  {error && <span className="text-red-600 text-sm">{error.message}</span>}
                </div>
              )}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Departement</label>
          <Controller
            control={form.control}
            name="payroll_departement_operator"
            rules={{ required: 'Departement is required' }}
            render={({ field: { value }, fieldState: { error } }) => (
              <div>
                <Input
                  value={value ?? ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Departement auto-filled"
                />
                {error && <span className="text-red-600 text-sm">{error.message}</span>}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default OperatorForm;
