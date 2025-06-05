import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
  },
  table: {
    width: '100%',
    border: '1px solid black',
    borderCollapse: 'collapse',
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid black',
  },
  cellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    padding: 3,
    textAlign: 'center',
    borderRight: '1px solid black',
  },
  cell: {
    fontSize: 9,
    padding: 3,
    borderRight: '1px solid black',
  },
  lastCell: {
    borderRight: 'none',
  },
  displayLogo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pageFooter: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default function LaporanJftPDF({ data }: { data: any[] }) {
  const totalPages = Math.ceil(data.length / 20);
  const pageData = [];
  for (let i = 0; i < totalPages; i++) {
    pageData.push(data.slice(i * 20, (i + 1) * 20));
  }

  return (
    <Document>
      {data.length === 0 ? (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.displayHeader}>
            <View style={styles.displayLogo}>
              <Image style={{ width: 40, height: 40, marginRight: 5 }} src="/images/logo.png" />
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>PT. SAGATRADE MURNI</Text>
                <Text style={{ fontSize: 14 }}>Primary Cementing Equipment</Text>
              </View>
            </View>
            <View>
              <Text style={styles.headerText}>List of Tools/JFT In Use</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10 }}>Page 1 of 1</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.cellHeader, { width: '10%' }]}>Usage No</Text>
              <Text style={[styles.cellHeader, { width: '12%' }]}>Issued Date/Time</Text>
              <Text style={[styles.cellHeader, { width: '20%' }]}>Issued By</Text>
              <Text style={[styles.cellHeader, { width: '20%' }]}>Operator/Name</Text>
              <Text style={[styles.cellHeader, { width: '7%' }]}>JFT. No</Text>
              <Text style={[styles.cellHeader, { width: '15%' }]}>Description</Text>
              <Text style={[styles.cellHeader, { width: '10%' }]}>Serial Number</Text>
              <Text style={[styles.cellHeader, { width: '15%' }]}>Size</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.cell, { width: '100%', textAlign: 'center' }]}>
                Tidak ada barang yang dipinjam
              </Text>
            </View>
          </View>
        </Page>
      ) : (
        pageData.map((pageItems, pageIndex) => (
          <Page size="A4" orientation="landscape" style={styles.page} key={pageIndex}>
            <View style={styles.displayHeader}>
              <View style={styles.displayLogo}>
                <Image style={{ width: 40, height: 40, marginRight: 5 }} src="/images/logo.png" />
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>PT. SAGATRADE MURNI</Text>
                  <Text style={{ fontSize: 14 }}>Primary Cementing Equipment</Text>
                </View>
              </View>
              <View>
                <Text style={styles.headerText}>List of Tools/JFT In Use</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10 }}>
                  Page {pageIndex + 1} of {totalPages}
                </Text>
              </View>
            </View>

            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={[styles.cellHeader, { width: '10%' }]}>Usage No</Text>
                <Text style={[styles.cellHeader, { width: '12%' }]}>Issued Date/Time</Text>
                <Text style={[styles.cellHeader, { width: '20%' }]}>Issued By</Text>
                <Text style={[styles.cellHeader, { width: '20%' }]}>Operator/Name</Text>
                <Text style={[styles.cellHeader, { width: '7%' }]}>JFT. No</Text>
                <Text style={[styles.cellHeader, { width: '15%' }]}>Description</Text>
                <Text style={[styles.cellHeader, { width: '10%' }]}>Serial Number</Text>
                <Text style={[styles.cellHeader, { width: '15%' }]}>Size</Text>
              </View>

              {pageItems.map((tool, index) => (
                <View key={index} style={styles.row}>
                  <Text style={[styles.cell, { width: '10%' }]}>{tool.usage_no}</Text>
                  <Text style={[styles.cell, { width: '12%' }]}>
                    {tool.instruments[0].tgl_diterima
                      ? new Date(tool.instruments[0].tgl_diterima).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </Text>
                  <Text style={[styles.cell, { width: '20%' }]}>
                    {tool.instruments[0].issued_by}
                  </Text>
                  <Text style={[styles.cell, { width: '20%' }]}>
                    {tool.instruments[0].no_payroll + ' - ' + tool.instruments[0].nama}
                  </Text>
                  <Text style={[styles.cell, { width: '7%' }]}>{tool.jft_no}</Text>
                  <Text style={[styles.cell, { width: '15%' }]}>
                    {tool.masterBarang?.description || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: '10%' }]}>
                    {tool.masterBarang?.serial_number || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: '15%' }]}>
                    {tool.masterBarang?.size || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </Page>
        ))
      )}
    </Document>
  );
}
