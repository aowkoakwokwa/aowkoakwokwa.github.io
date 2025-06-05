import { useState } from 'react';
import { Menu, MenuItem, Checkbox, Button, Tooltip } from '@mui/joy';
import { KeyboardArrowUpOutlined, KeyboardArrowDownOutlined } from '@mui/icons-material';
import { Controller } from 'react-hook-form';

interface SelectWithCheckboxProps {
  control: any;
  name: string;
}

export default function SelectWithCheckbox({ control, name }: SelectWithCheckboxProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const options = [
    'Operator Error',
    'Programming',
    'Machine',
    'Tooling',
    'Material',
    'Inspection',
    'Work Order',
    'Drawing',
    'Storage',
    'Handling',
    'Sub-Contractor',
    'Supplier/Customer',
    'Process Method',
  ];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (value) => (value && value.length > 0) || 'Please select at least one option',
      }}
      render={({ field, fieldState }) => {
        const selectedValues = field.value ? field.value.split(', ') : [];

        return (
          <div>
            <div className="mb-4 flex border border-[#cdd7e1] bg-[#fbfcfe] text-[#7d8186] hover:bg-[#f0f4f8] p-[1.5px] rounded-md">
              <Tooltip
                title={fieldState.error ? fieldState.error.message : ''}
                open={!!fieldState.error}
                placement="top"
                arrow
              >
                <div className="w-full">
                  <Button
                    variant="soft"
                    onClick={handleClick}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontWeight: 'normal',
                      fontSize: '16px',
                      backgroundColor: 'transparent',
                      marginRight: '5px',
                      color: '#7d8186',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      '&:hover': {
                        backgroundColor: '#f0f4f8',
                      },
                    }}
                  >
                    {selectedValues.length > 0 ? selectedValues.join(', ') : 'Choose one...'}
                  </Button>
                </div>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                placement="bottom-start"
                className="h-40 overflow-y-auto"
                sx={{ zIndex: 1300 }}
              >
                {options.map((option) => (
                  <MenuItem
                    key={option}
                    onClick={() => {
                      const newSelectedValues = selectedValues.includes(option)
                        ? selectedValues.filter((item: string) => item !== option)
                        : [...selectedValues, option];

                      field.onChange(newSelectedValues.join(', ')); // Simpan sebagai string
                    }}
                  >
                    <Checkbox checked={selectedValues.includes(option)} />
                    {option}
                  </MenuItem>
                ))}
              </Menu>

              <div className="max-w-fit py-[0.5] pr-2">
                <div>
                  <div className="max-w-fit h-[10px]">
                    <KeyboardArrowUpOutlined sx={{ fontSize: '14px', color: '#70777f' }} />
                  </div>
                  <div className="max-w-fit h-[10px]">
                    <KeyboardArrowDownOutlined sx={{ fontSize: '14px', color: '#70777f' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
