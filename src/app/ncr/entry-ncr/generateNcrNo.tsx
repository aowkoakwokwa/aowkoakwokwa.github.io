import React, { useState, useEffect } from 'react';
import Input from '@mui/joy/Input';
import { generateNCRNo } from '@/lib/getData';

const NcrComponent = ({
  selectedDept,
  selectedNcr,
  id,
  value,
  onChange,
}: {
  selectedDept: string;
  selectedNcr: string;
  id?: string | null;
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const [ncrNo, setNcrNo] = useState<string>(value ?? '');

  useEffect(() => {
    const fetchData = async () => {
      if (!id && selectedDept && selectedNcr) {
        try {
          const val = await generateNCRNo(selectedDept, selectedNcr);
          if (!val || !val.prefix || !val.data?.ncr_no) {
            console.error('Invalid NCR No data received:', val);
            return;
          }

          const prefix = val.prefix;
          const ncrNo = val.data.ncr_no;
          const temp = ncrNo ? ncrNo.split(':')[1].split('/')[0] : '000';
          const no = String(Number(temp) + 1).padStart(3, '0');
          const newNcrNo = `${prefix}:${no}/NCR/${new Date().getFullYear()}`;
          setNcrNo(newNcrNo);
          onChange?.(newNcrNo);
        } catch (error) {
          console.error('Error fetching NCR No:', error);
        }
      }
    };

    if (!id) {
      fetchData();
    } else {
      setNcrNo(value || '');
    }
  }, [selectedDept, selectedNcr, value, id, onChange]);

  return (
    <div>
      <label className="block font-medium mb-1">NCR No</label>
      <Input
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        value={ncrNo}
        disabled
        placeholder="Type something.."
      />
    </div>
  );
};

export default NcrComponent;
