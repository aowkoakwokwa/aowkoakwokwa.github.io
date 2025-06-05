import { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { Autocomplete, Button, Input, Option, Select } from '@mui/joy';
import { Printer } from 'lucide-react';
import IssueRegisterPDF from './laporanIssuePdf';
import LaporanPenggunaanPDF from './laporanPenggunaan';
import { useQuery } from '@tanstack/react-query';
import { getDetailTool, getInstrumentData, getMaster, getNonMaster } from '@/lib/getData';
import LaporanPenggunaanFilterPDF from './laporanPenggunaanFilter';
import LaporanJftPDF from './laporanJftPDF';

const daftarBulan = [
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

const tahunList = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

export default function LaporanInstrument({ open, close }: { open: boolean; close: () => void }) {
  const [selectedOption, setSelectedOption] = useState('bulan');
  const [selectedUsageOption, setSelectedUsageOption] = useState('issue');
  const [selectedMonth, setSelectedMonth] = useState<string>('01');
  const [selectedJftNo, setSelectedJftNo] = useState<string>('');
  const [periodeStartMonth, setPeriodeStartMonth] = useState<string>('01');
  const [periodeEndMonth, setPeriodeEndMonth] = useState<string>('12');
  const [periodeYear, setPeriodeYear] = useState<number>(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedOperator, setSelectedOperator] = useState<{ label: string } | null>(null);
  const [workOrder, setWorkOrder] = useState<{ label: string } | null>(null);
  const [selectedUsageDetail, setSelectedUsageDetail] = useState<
    'all' | 'operator' | 'workorder' | null
  >('all');

  const { data: tools, isLoading } = useQuery({
    queryKey: ['getDetailTool'],
    queryFn: getDetailTool,
    refetchOnWindowFocus: false,
  });

  const { data: instrumentData } = useQuery({
    queryKey: ['getInstrumentData'],
    queryFn: getInstrumentData,
    refetchOnWindowFocus: false,
  });

  const { data: masterBarang } = useQuery({
    queryKey: ['getMaster'],
    queryFn: getMaster,
    refetchOnWindowFocus: false,
  });

  const { data: masterNonBarang } = useQuery({
    queryKey: ['getNonMaster'],
    queryFn: getNonMaster,
    refetchOnWindowFocus: false,
  });

  const getMatchedTools = () => {
    if (!tools || !instrumentData || !masterBarang || !masterNonBarang) return [];

    return tools.map((tool) => {
      const matchingPeminjaman = instrumentData.find((p) => p.usage_no === tool.usage_no);
      const deskripsi =
        masterBarang.find((m) => m.no_jft === tool.jft_no)?.description ||
        masterNonBarang.find((m) => m.no_jft === tool.jft_no)?.description ||
        '';

      return {
        ...tool,
        peminjaman: matchingPeminjaman || null,
        deskripsi,
      };
    });
  };

  const getMatchedUsage = () => {
    if (!tools || !instrumentData || !masterBarang || !masterNonBarang) return [];

    return instrumentData.map((instrument) => {
      const matchingTools = tools
        .filter((tool) => tool.usage_no === instrument.usage_no)
        .map((tool) => {
          const deskripsi =
            masterBarang.find((m) => m.no_jft === tool.jft_no)?.description ||
            masterNonBarang.find((m) => m.no_jft === tool.jft_no)?.description ||
            '';
          const size =
            masterBarang.find((m) => m.no_jft === tool.jft_no)?.size ||
            masterNonBarang.find((m) => m.no_jft === tool.jft_no)?.size ||
            '';
          const serial_number =
            masterBarang.find((m) => m.no_jft === tool.jft_no)?.serial_number ||
            masterNonBarang.find((m) => m.no_jft === tool.jft_no)?.serial_number ||
            '';

          return {
            ...tool,
            deskripsi,
            size,
            serial_number,
          };
        });

      return {
        ...instrument,
        tools: matchingTools,
      };
    });
  };

  const getUsedJFT = () => {
    if (!instrumentData || !tools || !masterBarang || !masterNonBarang) return [];
    const filteredTools = tools.filter((tool) => tool.kembali === 'Tidak');
    const usedJFT = filteredTools.map((tool) => {
      const relatedInstruments = instrumentData.filter(
        (instrument) => instrument.usage_no === tool.usage_no,
      );

      const relatedMasterData = {
        description:
          masterBarang.find((m) => m.no_jft === tool.jft_no)?.description ||
          masterNonBarang.find((m) => m.no_jft === tool.jft_no)?.description ||
          '',
        size:
          masterBarang.find((m) => m.no_jft === tool.jft_no)?.size ||
          masterNonBarang.find((m) => m.no_jft === tool.jft_no)?.size ||
          '',
        serial_number:
          masterBarang.find((m) => m.no_jft === tool.jft_no)?.serial_number ||
          masterNonBarang.find((m) => m.no_jft === tool.jft_no)?.serial_number ||
          '',
      };

      return {
        ...tool,
        instruments: relatedInstruments,
        masterBarang: relatedMasterData,
      };
    });

    return usedJFT;
  };

  const handlePrint = async () => {
    if (selectedUsageOption === 'issue') {
      if (!selectedJftNo || selectedJftNo.trim() === '') {
        alert('JFT No harus diisi');
        return;
      }
    } else if (selectedUsageOption === 'usage') {
      if (!selectedOperator) {
        alert('Operator harus diisi');
        return;
      } else if (!workOrder) {
        alert('Work Order harus diisi');
        return;
      }
    }

    let pdfComponent = null;
    const filteredData = getUsedJFT();
    const matchedTools = getMatchedTools();
    const instrumentDataWithTools = getMatchedUsage();
    const toolData = matchedTools.filter((tool) => tool.jft_no === selectedJftNo);
    const filteredInstrumentData = instrumentDataWithTools.filter((instrument) => {
      if (!instrument.tgl_diterima) return false;

      const date = new Date(instrument.tgl_diterima);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      if (selectedOption === 'periode') {
        const startMonth = Number(periodeStartMonth);
        const endMonth = Number(periodeEndMonth);

        const monthInRange = month >= startMonth && month <= endMonth;
        const yearMatch = year === Number(periodeYear);

        return monthInRange && yearMatch;
      }
      const monthMatch = month === Number(selectedMonth);
      const yearMatch = year === Number(selectedYear);

      return monthMatch && yearMatch;
    });

    if (selectedUsageOption === 'issue') {
      if (selectedOption === 'bulan') {
        pdfComponent = (
          <IssueRegisterPDF year={selectedYear} month={selectedMonth} tools={toolData} />
        );
      } else if (selectedOption === 'periode') {
        pdfComponent = (
          <IssueRegisterPDF
            year={periodeYear}
            month={periodeStartMonth + '-' + periodeEndMonth}
            tools={toolData}
          />
        );
      }
    } else if (selectedUsageOption === 'usage') {
      if (selectedOption === 'bulan') {
        if (selectedUsageDetail === 'all') {
          pdfComponent = (
            <LaporanPenggunaanPDF
              month={selectedMonth}
              year={selectedYear}
              data={filteredInstrumentData}
            />
          );
        } else if (selectedUsageDetail === 'operator') {
          pdfComponent = (
            <LaporanPenggunaanFilterPDF
              month={selectedMonth}
              year={selectedYear}
              filter={selectedUsageOption + ' ' + selectedOperator?.label}
              data={filteredInstrumentData}
            />
          );
        } else if (selectedUsageDetail === 'workorder') {
          pdfComponent = (
            <LaporanPenggunaanFilterPDF
              month={selectedMonth}
              year={selectedYear}
              filter={selectedUsageDetail + ' ' + workOrder?.label}
              data={filteredInstrumentData}
            />
          );
        }
      } else if (selectedOption === 'periode') {
        if (selectedUsageDetail === 'all') {
          pdfComponent = (
            <LaporanPenggunaanPDF
              month={periodeStartMonth + '-' + periodeEndMonth}
              year={periodeYear}
              data={filteredInstrumentData}
            />
          );
        } else if (selectedUsageDetail === 'operator') {
          pdfComponent = (
            <LaporanPenggunaanFilterPDF
              month={periodeStartMonth + '-' + periodeEndMonth}
              year={selectedYear}
              filter={selectedUsageOption + ' ' + selectedOperator?.label}
              data={filteredInstrumentData}
            />
          );
        } else if (selectedUsageDetail === 'workorder') {
          pdfComponent = (
            <LaporanPenggunaanFilterPDF
              month={periodeStartMonth + '-' + periodeEndMonth}
              year={selectedYear}
              filter={selectedUsageDetail + ' ' + workOrder?.label}
              data={filteredInstrumentData}
            />
          );
        }
      }
    } else if (selectedUsageOption === 'jft') {
      pdfComponent = <LaporanJftPDF data={filteredData} />;
    }

    if (pdfComponent) {
      const blob = await pdf(pdfComponent).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Laporan Peminjaman Tool</DialogTitle>
      <DialogContent>
        <div className="flex items-center mb-2 gap-4 justify-between">
          <div className="flex gap-2 w-44">
            <input
              type="radio"
              name="filter"
              id="bulan"
              checked={selectedOption === 'bulan'}
              disabled={selectedUsageOption === 'jft'}
              onChange={() => setSelectedOption('bulan')}
            />
            <label htmlFor="bulan">Bulan</label>
          </div>
          <div className="w-full flex gap-2">
            <Select
              placeholder="Pilih Bulan"
              className="w-full"
              value={selectedMonth}
              slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
              disabled={selectedOption === 'periode' || selectedUsageOption === 'jft'}
              onChange={(_, value) => {
                if (typeof value === 'string') {
                  setSelectedMonth(value);
                }
              }}
            >
              {daftarBulan.map((bulan, index) => (
                <Option key={index} value={index + 1 < 10 ? `0${index + 1}` : `${index + 1}`}>
                  {bulan}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Tahun"
              className="w-full"
              value={selectedYear}
              slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
              disabled={selectedOption === 'periode' || selectedUsageOption === 'jft'}
              onChange={(_, value) => {
                if (typeof value === 'number') {
                  setSelectedYear(value);
                }
              }}
            >
              {tahunList.map((tahun) => (
                <Option key={tahun} value={tahun}>
                  {tahun}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex items-start gap-4 justify-between mb-2">
          <div className="flex gap-2 w-44">
            <input
              type="radio"
              name="filter"
              id="periode"
              checked={selectedOption === 'periode'}
              disabled={selectedUsageOption === 'jft'}
              onChange={() => setSelectedOption('periode')}
            />
            <label htmlFor="periode">Periode</label>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2">
              <Select
                placeholder="Bulan Awal"
                className="w-full"
                value={periodeStartMonth}
                slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                disabled={selectedOption !== 'periode' || selectedUsageOption === 'jft'}
                onChange={(_, value) => {
                  if (typeof value === 'string') setPeriodeStartMonth(value);
                }}
              >
                {daftarBulan.map((bulan, index) => (
                  <Option key={index} value={index + 1 < 10 ? `0${index + 1}` : `${index + 1}`}>
                    {bulan}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Bulan Akhir"
                className="w-full"
                value={periodeEndMonth}
                slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                onChange={(_, value) => {
                  if (typeof value === 'string') setPeriodeEndMonth(value);
                }}
                disabled={selectedOption !== 'periode' || selectedUsageOption === 'jft'}
              >
                {daftarBulan.map((bulan, index) => (
                  <Option key={index} value={index + 1 < 10 ? `0${index + 1}` : `${index + 1}`}>
                    {bulan}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex">
              <Select
                placeholder="Tahun"
                className="w-full"
                value={periodeYear}
                slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                disabled={selectedOption !== 'periode' || selectedUsageOption === 'jft'}
                onChange={(_, value) => {
                  if (typeof value === 'string') setPeriodeYear(Number(value));
                }}
              >
                {tahunList.map((tahun) => (
                  <Option key={tahun} value={tahun}>
                    {tahun}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center mb-2 gap-4 justify-between">
          <div className="flex gap-2 w-44">
            <input
              type="radio"
              name="issued"
              id="issue"
              checked={selectedUsageOption === 'issue'}
              onChange={() => setSelectedUsageOption('issue')}
            />
            <label htmlFor="issue">Issue Register</label>
          </div>
          <div className="w-full flex gap-2">
            <Autocomplete
              className="w-full"
              placeholder="JFT No"
              options={
                tools
                  ? tools.filter(
                      (value, index, self) =>
                        index === self.findIndex((t) => t.jft_no === value.jft_no),
                    )
                  : []
              }
              getOptionLabel={(option) => option?.jft_no || ''}
              disabled={selectedUsageOption !== 'issue'}
              slotProps={{
                listbox: {
                  sx: { zIndex: 1300 },
                },
              }}
              loading={isLoading}
              onChange={(event, newValue) => setSelectedJftNo(newValue?.jft_no || '')}
              renderOption={(props, option) => {
                const { ownerState, ...restProps } = props as {
                  ownerState?: any;
                } & React.HTMLProps<HTMLLIElement>;

                return (
                  <li {...restProps} key={option?.id} className="p-2 hover:bg-gray-100">
                    {option?.jft_no}
                  </li>
                );
              }}
            />

            <input
              type="text"
              required
              value={selectedUsageOption === 'issue' ? selectedJftNo : ''}
              onChange={() => {}}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="flex items-start mb-4">
          <div className="w-[200px] gap-2 flex">
            <input
              type="radio"
              name="usageOption"
              id="usage"
              checked={selectedUsageOption === 'usage'}
              onChange={() => setSelectedUsageOption('usage')}
            />
            <label htmlFor="usage">Usage Detail</label>
          </div>
          <div className="w-full">
            <div className="flex gap-2">
              <input
                type="radio"
                id="usage-all"
                name="usageDetail"
                checked={selectedUsageDetail === 'all'}
                disabled={selectedUsageOption !== 'usage'}
                onChange={() => setSelectedUsageDetail('all')}
              />
              <label htmlFor="usage-all">All Usage</label>
            </div>
            <div>
              <div>
                <div className="flex gap-2">
                  <input
                    type="radio"
                    id="usage-operator"
                    name="usageDetail"
                    checked={selectedUsageDetail === 'operator'}
                    disabled={selectedUsageOption !== 'usage'}
                    onChange={() => setSelectedUsageDetail('operator')}
                  />
                  <label htmlFor="usage-operator">By Operator/Name</label>
                </div>

                <div>
                  <Autocomplete
                    placeholder={isLoading ? 'Loading...' : 'Pilih Operator'}
                    className="w-full"
                    options={
                      instrumentData
                        ? instrumentData
                            .filter(
                              (item, index, self) =>
                                item.nama && index === self.findIndex((t) => t.nama === item.nama),
                            )
                            .map((item) => ({ label: item.nama }))
                        : []
                    }
                    getOptionLabel={(option) => option?.label || ''}
                    value={selectedOperator}
                    onChange={(_, newValue) =>
                      setSelectedOperator(newValue ? { label: newValue.label as string } : null)
                    }
                    isOptionEqualToValue={(option, value) => option.label === value?.label}
                    disabled={
                      selectedUsageOption !== 'usage' ||
                      selectedUsageDetail !== 'operator' ||
                      isLoading
                    }
                    slotProps={{
                      listbox: {
                        sx: { zIndex: 1300 },
                      },
                    }}
                    renderOption={(props, option) => {
                      const { ownerState, ...restProps } = props as {
                        ownerState?: any;
                      } & React.HTMLProps<HTMLLIElement>;

                      return (
                        <li {...restProps} key={option?.label} className="p-2 hover:bg-gray-100">
                          {option?.label}
                        </li>
                      );
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <input
                  type="radio"
                  id="usage-workorder"
                  name="usageDetail"
                  checked={selectedUsageDetail === 'workorder'}
                  disabled={selectedUsageOption !== 'usage'}
                  onChange={() => setSelectedUsageDetail('workorder')}
                />
                <label htmlFor="usage-workorder">By Work Order</label>
              </div>

              <div>
                <Autocomplete
                  placeholder="Pilih Work Order"
                  className="w-full"
                  options={
                    instrumentData
                      ? instrumentData
                          .filter(
                            (item, index, self) =>
                              item.wo_refer_to &&
                              index === self.findIndex((t) => t.wo_refer_to === item.wo_refer_to),
                          )
                          .map((item) => ({ label: item.wo_refer_to }))
                      : []
                  }
                  getOptionLabel={(option) => option?.label || ''}
                  value={workOrder}
                  onChange={(_, newValue) =>
                    setWorkOrder(newValue ? { label: newValue.label as string } : null)
                  }
                  isOptionEqualToValue={(option, value) => option.label === value.label}
                  disabled={selectedUsageOption !== 'usage' || selectedUsageDetail !== 'workorder'}
                  slotProps={{
                    listbox: {
                      sx: { zIndex: 1300 },
                    },
                  }}
                  renderOption={(props, option) => {
                    const { ownerState, ...restProps } = props as {
                      ownerState?: any;
                    } & React.HTMLProps<HTMLLIElement>;

                    return (
                      <li {...restProps} key={option?.label} className="p-2 hover:bg-gray-100">
                        {option?.label}
                      </li>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start mb-4">
          <div className="w-[200px] gap-2 flex">
            <input
              type="radio"
              name="usageOption"
              id="jft"
              checked={selectedUsageOption === 'jft'}
              onChange={() => setSelectedUsageOption('jft')}
            />
            <label htmlFor="jft">Tools/JFT In Use</label>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button startDecorator={<Printer />} type="submit" color="success" onClick={handlePrint}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
