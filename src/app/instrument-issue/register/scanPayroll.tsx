'use client';

import { Button, Input, Autocomplete } from '@mui/joy';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useEffect, useState } from 'react';

interface EmployeeData {
  payroll_id: string;
  name: string;
  departement: string;
}

export default function ScanPayroll({
  open,
  close,
  onSuccess,
}: {
  open: boolean;
  close: () => void;
  onSuccess: () => void;
}) {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    fetch('/data/data.json')
      .then((res) => res.json())
      .then((data: EmployeeData[]) => {
        setEmployees(data);
      })
      .catch((err) => {
        console.error('Failed to fetch JSON:', err);
      });
  }, []);

  const handleSelect = (employee: EmployeeData | null) => {
    if (!employee) return;

    setSelectedEmployee(employee);
    sessionStorage.setItem('payroll_id', employee.payroll_id);
    sessionStorage.setItem('payroll_name', employee.name);
    sessionStorage.setItem('departement', employee.departement);

    setTimeout(() => {
      setSelectedEmployee(null);
      setInputValue('');
      close();
      onSuccess();
    }, 300);
  };

  const handleCancel = () => {
    sessionStorage.removeItem('payroll_id');
    sessionStorage.removeItem('payroll_name');
    sessionStorage.removeItem('departement');
    setSelectedEmployee(null);
    setInputValue('');
    close();
  };

  const handleInputChange = (_: any, value: string) => {
    setInputValue(value);
    const match = employees.find((e) => e.payroll_id.toLowerCase() === value.toLowerCase());
    if (match) {
      handleSelect(match);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Set Officer Personnel</DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-4">
          <Autocomplete
            placeholder="Scan or Search Payroll ID"
            options={employees}
            getOptionLabel={(option) => option.payroll_id}
            filterOptions={(options, { inputValue }) =>
              options.filter((opt) =>
                opt.payroll_id.toLowerCase().includes(inputValue.toLowerCase()),
              )
            }
            onInputChange={handleInputChange}
            onChange={(_, value) => handleSelect(value)}
            value={selectedEmployee}
            inputValue={inputValue}
            isOptionEqualToValue={(option, value) => option.payroll_id === value.payroll_id}
            slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
          />

          {/* Menampilkan nama jika terpilih */}
          <Input readOnly value={selectedEmployee?.name || ''} placeholder="Name" />

          <div className="flex justify-end gap-2 mt-2">
            <Button
              onClick={() => {
                setSelectedEmployee(null);
                setInputValue('');
              }}
            >
              Reset
            </Button>
            <Button color="danger" onClick={handleCancel} className="text-white">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
