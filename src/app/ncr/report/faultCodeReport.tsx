import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { getFilteredNCR } from '@/lib/getData';
import Chart from 'chart.js/auto';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 14, fontFamily: 'Times-Roman' },
  header: { fontSize: 20, textAlign: 'center', fontWeight: 'bold', marginHorizontal: 'auto' },
  secHeader: { fontSize: 16, fontWeight: 'bold', fontStyle: 'italic', marginHorizontal: 'auto' },
  subHeader: { fontSize: 14, textAlign: 'center', fontWeight: 'bold', marginHorizontal: 'auto' },
  table: { marginTop: 10, borderWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  tableCellHeader: {
    padding: 5,
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    backgroundColor: '#e0e0e0',
  },
  tableCell: { padding: 5, fontSize: 12, flex: 1, textAlign: 'center' },
  totalRow: { flexDirection: 'row', backgroundColor: '#d4d4d4', borderBottomWidth: 1 },
  grandTotalRow: { flexDirection: 'row', backgroundColor: '#c0c0c0' },
  image: { width: 550, height: 180, marginTop: 20, alignSelf: 'center' },
  logo: { width: 60, height: 60, alignSelf: 'center', marginHorizontal: 10 },
});

const getMonthsInRange = (bulan: string) => {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  if (bulan.includes('-')) {
    const [start, end] = bulan.split('-').map(Number);
    return monthNames.slice(start - 1, end);
  }
  return [monthNames[Number(bulan) - 1]];
};

const generateChartImage = (
  caseCounts: Record<string, Record<string, number>>,
  months: string[],
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');

    const scaleFactor = 2;
    canvas.width = 550 * scaleFactor;
    canvas.height = 180 * scaleFactor;

    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject('Canvas context tidak ditemukan');
      return;
    }

    const categoryColors: Record<string, string> = {
      'Operator Error': 'rgba(255, 99, 132, 0.6)', // Merah
      Programming: 'rgba(54, 162, 235, 0.6)', // Biru
      Machine: 'rgba(255, 206, 86, 0.6)', // Kuning
      Tooling: 'rgba(75, 192, 192, 0.6)', // Hijau Tosca
      Material: 'rgba(153, 102, 255, 0.6)', // Ungu
      Inspection: 'rgba(255, 159, 64, 0.6)', // Orange
      'Work Order': 'rgba(100, 100, 255, 0.6)',
      Drawing: 'rgba(255, 100, 200, 0.6)',
      Storage: 'rgba(0, 255, 100, 0.6)',
      Handling: 'rgba(200, 255, 100, 0.6)',
      'Sub-Contractor': 'rgba(100, 200, 255, 0.6)',
      'Supplier/Customer': 'rgba(255, 200, 100, 0.6)',
      'Process Method': 'rgba(0, 100, 255, 0.6)',
    };

    const categories = Object.keys(caseCounts[months[0]]);
    const datasets = categories.map((category) => ({
      label: category,
      data: months.map((month) => caseCounts[month][category] || 0),
      backgroundColor: categoryColors[category] || 'rgba(0, 0, 0, 0.6)', // Default hitam jika tidak ada
      borderColor: categoryColors[category]?.replace('0.6', '1') || 'rgba(0, 0, 0, 1)', // Lebih pekat
      borderWidth: 2,
      barThickness: Math.min(80 / months.length),
    }));

    new Chart(ctx, {
      type: 'bar',
      data: { labels: months, datasets },
      options: {
        responsive: false,
        devicePixelRatio: scaleFactor,
        plugins: { legend: { position: 'top', labels: { font: { size: 20 } } } },
        scales: {
          x: {
            ticks: { font: { size: 20 } },
          },
          y: {
            ticks: {
              font: { size: 20 },
              stepSize: 1,
            },
          },
        },
      },
    });

    setTimeout(() => {
      const imageUrl = canvas.toDataURL('image/png');
      document.body.removeChild(canvas);
      resolve(imageUrl);
    }, 1000);
  });
};

export async function generateFaultCodeReport(data: any) {
  try {
    const filteredData = await getFilteredNCR(
      data.tahun,
      data.bulan,
      data.source,
      data.departement,
    );
    const months = getMonthsInRange(data.bulan);
    const caseCounts: Record<string, Record<string, number>> = {};

    const categories = [
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

    months.forEach((month) => {
      caseCounts[month] = Object.fromEntries(categories.map((cat) => [cat, 0]));
    });

    filteredData.forEach((item) => {
      if (!item.issued_date) return;

      const issueMonth = new Date(item.issued_date).getMonth() + 1;
      const monthName = getMonthsInRange(issueMonth.toString())[0];

      if (!monthName || !caseCounts[monthName]) return;

      const categoryString = item.fault ?? '';
      const categoryList = categoryString.split(',').map((cat) => cat.trim());

      categoryList.forEach((category) => {
        if (!categories.includes(category)) {
          return;
        }

        if (!caseCounts[monthName][category]) {
          caseCounts[monthName][category] = 0;
        }
        caseCounts[monthName][category] += 1;
      });
    });

    const totalCounts = Object.fromEntries(categories.map((cat) => [cat, 0]));

    Object.values(caseCounts).forEach((monthData) => {
      categories.forEach((category) => {
        totalCounts[category] += monthData[category];
      });
    });

    const chartImage = await generateChartImage(caseCounts, months);

    const ReportDocument = (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* HEADER */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderBottom: '1px solid black',
              paddingBottom: 5,
              marginBottom: 10,
              justifyContent: 'center',
            }}
          >
            <View>
              <Image src={'/images/logo.png'} style={styles.logo} />
            </View>
            <View>
              <Text style={styles.header}>PT. SAGATRADE MURNI</Text>
              <Text style={styles.secHeader}>Primary Cementing Equipment</Text>
              <Text style={styles.subHeader}>RECAPITULATION OF NON - CONFORMANCE</Text>
              <Text style={styles.subHeader}>Floating - NCR On-Going Process Total Case</Text>
            </View>
          </View>

          {/* TABEL */}
          <View style={styles.table}>
            {/* HEADER TABEL */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCellHeader}>Month</Text>
              {categories.map((category) => (
                <Text key={category} style={[styles.tableCellHeader]}>
                  {category}
                </Text>
              ))}
            </View>

            {/* DATA PER BULAN */}
            {months.map((month) => (
              <View style={styles.tableRow} key={month}>
                <Text style={styles.tableCell}>{month}</Text>
                {categories.map((category) => (
                  <Text key={category} style={[styles.tableCell]}>
                    {caseCounts[month][category] || '-'}
                  </Text>
                ))}
              </View>
            ))}

            {/* TOTAL PER KATEGORI */}
            <View style={styles.totalRow}>
              <Text style={styles.tableCellHeader}>Total</Text>
              {categories.map((category) => (
                <Text key={category} style={[styles.tableCellHeader]}>
                  {totalCounts[category] || '-'}
                </Text>
              ))}
            </View>

            {/* GRAND TOTAL */}
            <View style={styles.grandTotalRow}>
              <Text style={styles.tableCellHeader}>Grand Total</Text>
              <Text style={styles.tableCellHeader}></Text>
              <Text style={styles.tableCellHeader}></Text>
              <Text style={styles.tableCellHeader}>
                {Object.values(totalCounts).reduce((sum, val) => sum + val, 0)}
              </Text>
              <Text style={styles.tableCellHeader}></Text>
              <Text style={styles.tableCellHeader}></Text>
            </View>
          </View>

          {/* GRAFIK */}
          <View style={{ flexDirection: 'column', marginTop: 20, alignItems: 'center' }}>
            <Text>Grafik Rekapitulasi NCR {data.source} (Total Pcs)</Text>
            <Text style={styles.subHeader}>
              {months.length > 1
                ? `${months[0]} - ${months[months.length - 1]}, ${data.tahun}`
                : `${months[0]}, ${data.tahun}`}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{ transform: 'rotate(270deg)', fontSize: 12, fontWeight: 'bold', top: 12 }}
            >
              Total Case
            </Text>
            {chartImage && <Image style={styles.image} src={chartImage} />}
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(ReportDocument).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error generating total case report:', error);
  }
}

export default generateFaultCodeReport;
