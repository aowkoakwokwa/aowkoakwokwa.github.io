import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import dayjs from 'dayjs';

const styles = StyleSheet.create({
  section: {
    margin: 5,
    padding: 5,
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  col: {
    width: '25%',
    fontSize: 10,
  },
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  boldText: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  blackLine: {
    height: 2,
    backgroundColor: 'black',
  },
  blackLineThin: {
    height: 1,
    backgroundColor: 'black',
    marginTop: 1,
    marginBottom: 1,
  },
  toolRow: {
    flexDirection: 'row',
    borderBottom: '1px solid black',
    paddingBottom: 2,
    paddingHorizontal: 10,
  },
});

export default function LaporanPenggunaanFilterPDF({
  month,
  year,
  data,
  filter,
}: {
  month: any;
  year: any;
  data: any[];
  filter: any;
}) {
  console.log(filter);

  const monthNames = [
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

  const filteredData = data.filter((item) => {
    if (filter) {
      if (filter.startsWith('workorder') && item.wo_refer_to) {
        const filterWorkorder = filter.split(' ')[1]?.trim();
        const woReferTo = item.wo_refer_to?.trim();
        return woReferTo === filterWorkorder;
      }

      if (filter.startsWith('usage') && item.nama) {
        const filterUsage = filter.split(' ')[1]?.trim();
        const nama = item.nama?.trim();
        return nama.toLowerCase().includes(filterUsage.toLowerCase());
      }
    }
    return true;
  });

  return (
    <Document>
      <Page orientation="landscape" size="A4" style={styles.page}>
        <View style={styles.section}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
              Laporan Penggunaan
            </Text>

            <Text style={{ fontSize: 14 }}>
              {(() => {
                if (typeof month === 'string' && month.includes('-')) {
                  const [start, end] = month.split('-').map(Number);
                  return `${monthNames[start - 1]} - ${monthNames[end - 1]} ${year}`;
                } else {
                  return `${monthNames[Number(month) - 1]} ${year}`;
                }
              })()}
            </Text>
          </div>

          <View style={{ marginTop: 10 }}>
            <View
              style={[
                styles.row,
                {
                  border: '1px solid black',
                  padding: 5,
                  backgroundColor: '#f2f2f2',
                },
              ]}
              wrap={false}
            >
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '5%' }]}>
                No.
              </Text>
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '15%' }]}>
                No. Pinjam
              </Text>
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '10%' }]}>
                Diterima
              </Text>
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '10%' }]}>
                Kembali
              </Text>
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '20%' }]}>
                Nama/Operator
              </Text>
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '10%' }]}>
                Departement
              </Text>
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '20%' }]}>
                Ref. WO & Special Note refer to
              </Text>
              <Text style={[styles.col, styles.tableHeader, { fontSize: 10, width: '10%' }]}>
                Batch Qty
              </Text>
            </View>

            {filteredData.map((item, index) => (
              <View key={`row-${index}`}>
                <View style={styles.row} wrap={false}>
                  <Text style={[styles.col, styles.boldText, { width: '5%' }]}>{index + 1}</Text>
                  <Text style={[styles.col, styles.boldText, { width: '15%' }]}>
                    {item.usage_no}
                  </Text>
                  <Text style={[styles.col, styles.boldText, { width: '10%' }]}>
                    {item.tgl_diterima ? dayjs(item.tgl_diterima).format('DD-MM-YYYY') : '-'}
                  </Text>
                  <Text style={[styles.col, styles.boldText, { width: '10%' }]}>
                    {item.tgl_kembali ? dayjs(item.tgl_kembali).format('DD-MM-YYYY') : '-'}
                  </Text>
                  <Text style={[styles.col, styles.boldText, { width: '20%' }]}>
                    {item.no_payroll}-{item.nama}
                  </Text>
                  <Text style={[styles.col, styles.boldText, { width: '10%' }]}>{item.dept}</Text>
                  <Text style={[styles.col, styles.boldText, { width: '20%' }]}>
                    {item.wo_refer_to}
                  </Text>
                  <Text style={[styles.col, styles.boldText, { width: '10%' }]}>
                    {item.batch_qty}
                  </Text>
                </View>

                <View wrap={false}>
                  <View>
                    <View style={[styles.row, { paddingHorizontal: 10 }]}>
                      <Text style={[styles.col]}>JFT No.</Text>
                      <Text style={styles.col}>Description</Text>
                      <Text style={styles.col}>Size</Text>
                      <Text style={styles.col}>Serial Number</Text>
                    </View>
                    <View style={styles.blackLine} />
                    <View style={styles.blackLineThin} />
                  </View>

                  {item.tools &&
                    item.tools.map((tool: any, toolIndex: number) => (
                      <View style={styles.toolRow} key={`tool-${index}-${toolIndex}`}>
                        <Text style={styles.col}>{tool.jft_no}</Text>
                        <Text style={styles.col}>{tool.deskripsi}</Text>
                        <Text style={styles.col}>{tool.size}</Text>
                        <Text style={styles.col}>{tool.serial_number}</Text>
                      </View>
                    ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
