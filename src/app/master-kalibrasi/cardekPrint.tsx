import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 5,
    borderWidth: 1,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderStyle: 'solid',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 5,
    flex: 1,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface CalibrationRecord {
  cal_date: string;
  next_cal_date: string;
  frequency: string;
  source: string;
  inspection_no: string;
  cert_no?: string;
  accept_criteria: string;
  location: string;
  signature: string;
}

const CalibrationRecordPDF: React.FC<{ data: CalibrationRecord[] }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src="/images/logo.png" />

          <View style={styles.titleContainer}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>PT. SAGATRADE MURNI</Text>
            <Text style={{ fontSize: 16 }}>Primary Cementing Equipment</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.table}>
          <Text style={styles.title}>CALIBRATION RECORD CARD</Text>
          <View style={[styles.row, styles.bold]}>
            {[
              'CAL DATE',
              'NEXT CAL DATE',
              'CAL FREQUENCY',
              'CAL SOURCE',
              'INSPECTION REPT. NO',
              'CERT. NO',
              'ACCEPT CRITERIA',
              'CAL LOCATION',
              'NAME & SIGNATURE',
            ].map((header, index) => (
              <Text key={index} style={styles.cell}>
                {header}
              </Text>
            ))}
          </View>

          {/* Table Rows */}
          {data.map((row: CalibrationRecord, index: number) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cell}>{row.cal_date}</Text>
              <Text style={styles.cell}>{row.next_cal_date}</Text>
              <Text style={styles.cell}>{row.frequency}</Text>
              <Text style={styles.cell}>{row.source}</Text>
              <Text style={styles.cell}>{row.inspection_no}</Text>
              <Text style={styles.cell}>{row.cert_no || '-'}</Text>
              <Text style={styles.cell}>{row.accept_criteria}</Text>
              <Text style={styles.cell}>{row.location}</Text>
              <Text style={styles.cell}>{row.signature}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default CalibrationRecordPDF;
