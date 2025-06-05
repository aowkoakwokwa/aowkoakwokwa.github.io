import React, { useState } from 'react';
import { Input } from '@mui/joy';
import dayjs from 'dayjs';

interface DateTimePickerProps {
  onChange?: (value: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ onChange }) => {
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const togglePicker = () => setShowPicker(!showPicker);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedDate(e.target.value);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedTime(e.target.value);

  const handleSelect = () => {
    if (selectedDate && selectedTime) {
      const formattedDateTime = `${dayjs(selectedDate).format('MM/DD/YYYY')} ${selectedTime}`;
      setSelectedDateTime(formattedDateTime);
      onChange?.(formattedDateTime);
      setShowPicker(false);
    } else {
      alert('Harap pilih tanggal dan waktu!');
    }
  };

  return (
    <div className="w-[48%]">
      <div style={{ width: '100%', position: 'relative' }}>
        <Input
          type="text"
          id="datetime"
          value={selectedDateTime ? dayjs(selectedDateTime).format('MM/DD/YYYY HH:mm:ss') : ''}
          onClick={togglePicker}
          placeholder="Pilih tanggal dan waktu"
          readOnly
          sx={{ paddingY: '10px', cursor: 'pointer' }}
        />
        {showPicker && (
          <div
            style={{
              position: 'absolute',
              backgroundColor: '#fbfcfe',
              border: '2px solid #ccc',
              padding: '10px',
              borderRadius: '8px',
              zIndex: 10,
              marginTop: '10px',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              width: '100%',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                slotProps={{
                  input: { min: dayjs().add(0, 'day').format('YYYY-MM-DD') },
                }}
              />

              <Input type="time" value={selectedTime} onChange={handleTimeChange} />
            </div>
            <button
              onClick={handleSelect}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#0b6bcb',
                fontWeight: 'bold',
                fontSize: '14px',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                width: '100%',
              }}
            >
              Pilih
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;
