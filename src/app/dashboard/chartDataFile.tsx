import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { getDetailTool } from '@/lib/getData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type ChartDataFileProps = {
  mode: 'periode' | 'tahun';
};

export default function ChartDataFile({ mode }: ChartDataFileProps) {
  const { data: tools, isLoading } = useQuery({
    queryKey: ['getDetailTool'],
    queryFn: getDetailTool,
    refetchOnWindowFocus: false,
  });

  const year = new Date().getFullYear();

  const monthLabels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const yearLabels = [`${year - 2}`, `${year - 1}`, `${year}`];

  const monthCounts = Array(12).fill(0);
  const yearCounts = {
    [year - 2]: 0,
    [year - 1]: 0,
    [year]: 0,
  };

  if (tools && Array.isArray(tools)) {
    tools.forEach((item) => {
      const date = new Date(item.create_at);
      const itemYear = date.getFullYear();
      const itemMonth = date.getMonth();

      if (mode === 'periode' && itemYear === year) {
        monthCounts[itemMonth] += 1;
      }

      if (mode === 'tahun' && yearCounts.hasOwnProperty(itemYear)) {
        yearCounts[itemYear] += 1;
      }
    });
  }

  const data = {
    labels: mode === 'periode' ? monthLabels : yearLabels,
    datasets: [
      {
        label: mode === 'periode' ? 'Penggunaan per Bulan' : 'Penggunaan per Tahun',
        data: mode === 'periode' ? monthCounts : Object.values(yearCounts),
        backgroundColor: '#f75252',
        borderRadius: 5,
        barThickness: 40,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full h-full shadow-md rounded-lg p-2">
      {isLoading ? (
        <p className="text-center">Memuat data...</p>
      ) : (
        <Bar options={options} data={data} className="w-full h-full" />
      )}
    </div>
  );
}
