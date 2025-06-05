import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SubTitle } from 'chart.js';
import dayjs from 'dayjs';

export default function IssueRegisterPDF({
  month,
  year,
  tools,
}: {
  month: string;
  year: any;
  tools: any[];
}) {
  console.log(month, year, tools);
  let startMonth = 1;
  let endMonth = 12;

  if (month.includes('-')) {
    const [start, end] = month.split('-').map((m: string) => parseInt(m, 10));
    startMonth = start;
    endMonth = end;
  } else {
    const singleMonth = parseInt(month, 10);
    startMonth = endMonth = singleMonth;
  }

  const yearNumber = parseInt(year.toString(), 10);

  const filteredTools = tools
    .filter((tool) => {
      const peminjaman = tool.peminjaman;
      if (!peminjaman || peminjaman.status !== 'Sudah_Kembali') return false;

      const diterimaDate = new Date(peminjaman.tgl_diterima);
      const diterimaMonth = diterimaDate.getMonth() + 1;
      const diterimaYear = diterimaDate.getFullYear();

      return (
        diterimaYear === yearNumber && diterimaMonth >= startMonth && diterimaMonth <= endMonth
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.peminjaman.tgl_diterima);
      const dateB = new Date(b.peminjaman.tgl_diterima);
      return dateA.getTime() - dateB.getTime();
    });

  console.log(filteredTools);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <div style={styles.leftHeader}>
            <Image src="/images/logo.png" style={styles.logo} />
            <div style={styles.titleContainer}>
              <Text style={styles.title}>PT. SAGATRADE MURNI</Text>
              <Text style={styles.subTitle}>Primary Cementing Equipment</Text>
            </div>
          </div>
          <div style={styles.titleContainer}>
            <Text style={styles.title2}>INSTRUMENT ISSUE REGISTER</Text>
          </div>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <div style={styles.thNo}>
              <Text>No.</Text>
            </div>
            <div style={styles.thDesc}>
              <Text>JFT/Description</Text>
            </div>
            <div style={styles.thRef}>
              <Text>Reference Work Order and Special Note refer to</Text>
            </div>
            <div style={styles.thQty}>
              <Text>Qty</Text>
            </div>
            <div style={styles.thIssued}>
              <div style={styles.border}>
                <Text>ISSUED</Text>
              </div>
              <div style={styles.subTh}>
                <Text style={styles.subThReturned}>Date</Text>
                <Text style={styles.subThReturned}>User</Text>
                <Text style={styles.subThReturned}>Issuer</Text>
                <Text style={styles.subThReturn}>Condition</Text>
              </div>
            </div>
            <div style={styles.thReturned}>
              <div style={styles.bordered}>
                <Text>RETURN</Text>
              </div>
              <div style={styles.subTh}>
                <Text style={styles.subThReturned}>Date</Text>
                <Text style={styles.subThReturned}>User</Text>
                <Text style={styles.subThReturned}>Receiver</Text>
                <Text style={styles.subThReturned}>Condition</Text>
              </div>
            </div>
          </View>

          {filteredTools.length === 0 ? (
            <View
              style={[
                styles.tableRow,
                { borderBottom: '1px solid black', borderRight: '1px solid black' },
              ]}
            >
              <Text
                style={{
                  padding: 10,
                  fontSize: 12,
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                Tidak ada data issue untuk periode ini.
              </Text>
            </View>
          ) : (
            filteredTools.map((tool, i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.thNo}>{i + 1}</Text>
                <Text style={styles.thDesc}>
                  {tool.jft_no} / {tool.deskripsi}
                </Text>
                <Text style={styles.thRef}>{tool.peminjaman?.wo_refer_to ?? '-'}</Text>
                <Text style={styles.thQty}>{tool.peminjaman?.batch_qty ?? '-'}</Text>

                <View style={styles.thIssued}>
                  <div style={styles.subTh}>
                    <Text style={styles.subThReturned}>
                      {dayjs(tool.peminjaman?.tgl_diterima).format('DD-MM-YYYY')}
                    </Text>
                    <Text style={styles.subThReturned}>{tool.peminjaman?.issued_by ?? '-'}</Text>
                    <Text style={styles.subThReturned}>
                      {tool.peminjaman?.no_payroll && tool.peminjaman?.nama
                        ? `${tool.peminjaman.no_payroll} - ${tool.peminjaman.nama}`
                        : '-'}
                    </Text>
                    <Text style={styles.subThReturn}>{tool.kondisi ?? '-'}</Text>
                  </div>
                </View>

                <View style={styles.thReturned}>
                  <div style={styles.subTh}>
                    <Text style={styles.subThReturned}>
                      {dayjs(tool.peminjaman?.tgl_diterima).format('DD-MM-YYYY')}
                    </Text>
                    <Text style={styles.subThReturned}>{tool.peminjaman?.user_return ?? '-'}</Text>
                    <Text style={styles.subThReturned}>{tool.peminjaman?.return_by ?? '-'}</Text>
                    <Text style={styles.subThReturned}>{tool.kondisi2 ?? '-'}</Text>
                  </div>
                </View>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftHeader: {
    display: 'flex',
    flexDirection: 'row',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 12,
  },
  title2: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  border: {
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingVertical: 4,
  },
  bordered: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#eee',
    fontWeight: 'bold',
  },
  thNo: {
    width: '3%',
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thDesc: {
    width: '12%',
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thRef: {
    width: '17%',
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thQty: {
    width: '3%',
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thIssued: {
    width: '32.5%',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
  },
  thReturned: {
    width: '32.5%',
    borderBottomWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
  },
  subTh: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  subThReturned: {
    width: '25%',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  subThReturn: {
    width: '25%',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
});
