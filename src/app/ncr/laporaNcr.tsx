import { Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material';
import { Select, Option, Button, Radio, RadioGroup, CircularProgress } from '@mui/joy';
import { useState } from 'react';
import { generateDefectReport } from './report/defectReport';
import { generateEntryReport } from './report/entryReport';
import { generateFaultCodeReport } from './report/faultCodeReport';
import generateTotalCaseReport from './report/totalCaseReport';
import generateTotalPcsReport from './report/totalPcsReport';

export default function LaporanNcr({ open, close }: { open: boolean; close: () => void }) {
  const [periode, setPeriode] = useState<'bulan' | 'periode' | null>('bulan');
  const [bulan, setBulan] = useState('Januari');
  const [bulanMulai, setBulanMulai] = useState('Januari');
  const [bulanAkhir, setBulanAkhir] = useState('Desember');
  const [selectedReport, setSelectedReport] = useState('entry');
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>('Semua');
  const [selectedYear, setSelectedYear] = useState<string | null>(String(new Date().getFullYear()));
  const [selectedDepartement, setSelectedDepartement] = useState<string | null>('Semua');
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handlePrint = async () => {
    setLoading(true);
    try {
      const monthToNumber = (month: string) => {
        const months: { [key: string]: string } = {
          Januari: '01',
          Februari: '02',
          Maret: '03',
          April: '04',
          Mei: '05',
          Juni: '06',
          Juli: '07',
          Agustus: '08',
          September: '09',
          Oktober: '10',
          November: '11',
          Desember: '12',
        };
        return months[month] || '00';
      };

      const reportData = {
        source: selectedSource,
        tahun: selectedYear,
        bulan:
          periode === 'bulan'
            ? monthToNumber(bulan)
            : `${monthToNumber(bulanMulai)} - ${monthToNumber(bulanAkhir)}`,
        departement: selectedDepartement,
      };

      switch (selectedReport) {
        case 'entry':
          await generateEntryReport(reportData);
          break;
        case 'defect':
          await generateDefectReport(reportData);
          break;
        case 'pcs':
          await generateTotalPcsReport(reportData);
          break;
        case 'case':
          await generateTotalCaseReport(reportData);
          break;
        case 'fault':
          await generateFaultCodeReport(reportData);
          break;
        default:
          console.error('Unknown report type');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const bulanMulaiIndex = months.indexOf(bulanMulai);

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') {
          close();
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Laporan NCR</DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <span className="font-medium">Periode Tahun</span>
            <Select
              className="w-full"
              required
              placeholder="Pilih Tahun..."
              slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
              value={selectedYear}
              onChange={(e, newValue) => setSelectedYear(newValue as string)}
            >
              {Array.from({ length: currentYear - 2012 + 2 }, (_, i) => 2012 + i).map((year) => (
                <Option key={year} value={year.toString()}>
                  {year}
                </Option>
              ))}
            </Select>
          </div>

          <RadioGroup
            value={periode}
            onChange={(e) => setPeriode(e.target.value as 'bulan' | 'periode')}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <Radio value="bulan" label="Per Bulan" />
                <Select
                  className="w-full"
                  required
                  disabled={periode !== 'bulan'}
                  placeholder="Pilih Bulan..."
                  onChange={(e, newValue) => setBulan(newValue as string)}
                  value={bulan}
                  slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                >
                  {months.map((month) => (
                    <Option key={month} value={month}>
                      {month}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Radio value="periode" label="Per Periode Bulan" />
                <div className="flex gap-4 items-center">
                  <Select
                    className="w-full"
                    required
                    disabled={periode !== 'periode'}
                    placeholder="Pilih Bulan Awal..."
                    onChange={(e, newValue) => setBulanMulai(newValue as string)}
                    value={bulanMulai}
                    slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                  >
                    {months.map((month) => (
                      <Option key={month} value={month}>
                        {month}
                      </Option>
                    ))}
                  </Select>
                  <span>s/d</span>
                  <Select
                    className="w-full"
                    required
                    disabled={periode !== 'periode' || !bulanMulai}
                    placeholder="Pilih Bulan Akhir..."
                    onChange={(e, newValue) => setBulanAkhir(newValue as string)}
                    value={bulanAkhir}
                    slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                  >
                    {months.map((month, index) => (
                      <Option key={month} value={month} disabled={index <= bulanMulaiIndex}>
                        {month}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="border border-gray-200 p-2 rounded-xl mt-2 gap-2 flex flex-col">
          <div className="flex flex-col gap-2">
            <span className="font-medium">Departemen</span>
            <Select
              className="w-full"
              required
              placeholder="Pilih Departemen..."
              slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
              value={selectedDepartement}
              onChange={(e, newValue) => setSelectedDepartement(newValue as string)}
              defaultValue="Semua"
            >
              <Option defaultChecked value="Semua">
                Semua
              </Option>
              <Option value="CNC">CNC</Option>
              <Option value="Assembly">Assembly</Option>
              <Option value="SCP">SCP</Option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-medium">Source</span>
            <Select
              className="w-full"
              required
              placeholder="Pilih Departemen..."
              slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
              value={selectedSource}
              onChange={(e, newValue) => setSelectedSource(newValue as string)}
            >
              <Option value="Semua">Semua</Option>
              <Option value="Supplier">Supplier</Option>
              <Option value="Process">Process</Option>
              <Option value="ExStock">ExStock</Option>
              <Option value="Customer">Customer</Option>
            </Select>
          </div>

          <RadioGroup
            name="reportType"
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col gap-2">
              <Radio value="entry" label="Rekapitulasi Entry Data" />
            </div>
            <div className="flex gap-2">
              <Radio value="defect" label="Defect Analysis" />
            </div>
            <div className="flex flex-col gap-2">
              <Radio value="pcs" label="Total Pcs Report" />
            </div>

            <div className="flex flex-col gap-2">
              <Radio value="case" label="Total Case Report" />
            </div>

            <div className="flex flex-col gap-2">
              <Radio value="fault" label="Fault Code Report" />
            </div>
          </RadioGroup>
        </div>
      </DialogContent>

      <DialogActions className="flex justify-end gap-2 p-4">
        <Button
          onClick={handlePrint}
          color="success"
          disabled={loading}
          startDecorator={loading ? <CircularProgress size="sm" /> : null}
        >
          {loading ? 'Generating...' : 'Print'}
        </Button>
        <Button type="button" color="danger" onClick={close}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
