import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { getFilteredNCR } from '@/lib/getData';
import dayjs from 'dayjs';

export async function generateEntryReport(data: any) {
  console.log(data);
  try {
    const filteredData = await getFilteredNCR(
      data.tahun,
      data.bulan,
      data.source,
      data.departement,
    );

    const sanitizedData = filteredData.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, value === null ? '-' : value]),
      ),
    );

    console.log(sanitizedData);

    const styles = StyleSheet.create({
      page: { padding: 20, fontSize: 10, fontFamily: 'Times-Roman' },
      headerContainer: {
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        justifyContent: 'space-between',
        left: -250,
        top: 385,
        alignItems: 'center',
        transform: 'rotate(-90deg)',
      },
      tableContainer: {
        position: 'absolute',
        left: 15,
        top: 225,
        transform: 'rotate(-90deg)',
        transformOrigin: '300 300',
      },
      table: {
        borderTop: '1px solid black',
        borderLeft: '1px solid black',
        borderRight: '1px solid black',
        borderColor: '#000',
      },
      tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
      tableCellHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#e0e0e0',
        padding: 3,
        flexShrink: 1,
      },
      tableCell: {
        fontSize: 8,
        textAlign: 'justify',
        padding: 3,
        flexShrink: 1,
      },

      headerText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
      subHeaderText: { fontSize: 12, textAlign: 'center' },
      totalRow: { flexDirection: 'row', backgroundColor: '#d4d4d4' },
      grandTotalRow: { flexDirection: 'row', backgroundColor: '#c0c0c0' },
      logo: { width: 40, height: 40, marginRight: 10 },
    });

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

    const caseCounts: Record<string, number> = {};
    const totalCounts = Object.fromEntries(categories.map((cat) => [cat, 0]));

    sanitizedData.forEach((item: any) => {
      const categoryList = (item.fault ?? '').split(',').map((cat: string) => cat.trim());
      categoryList.forEach((category: string) => {
        if (!caseCounts[category]) caseCounts[category] = 0;
        caseCounts[category] += 1;
        if (!totalCounts[category]) totalCounts[category] = 0;
        totalCounts[category] += 1;
      });
    });

    const parsedData = sanitizedData.map((item: any) => {
      const categoryList = (item.fault ?? '').split(',').map((cat: string) => cat.trim());

      const faultsObj: Record<string, number> = {};
      categoryList.forEach((category: any) => {
        faultsObj[category] = (faultsObj[category] || 0) + 1;
      });

      return { ...item, faults: faultsObj };
    });

    const totalFaults = parsedData.reduce((acc: Record<string, number>, row: any) => {
      Object.keys(row.faults).forEach((key) => {
        acc[key] = (acc[key] || 0) + row.faults[key];
      });
      return acc;
    }, {});

    const totalCases = filteredData.reduce(
      (acc, item) => {
        const caseKey = item.case ?? 'Unknown';

        if (!acc[caseKey]) {
          acc[caseKey] = { pcs: 0, kg: 0 };
        }

        acc[caseKey].pcs += item.pcs ?? 0;
        acc[caseKey].kg += item.kg ?? 0;

        return acc;
      },
      {} as Record<string, { pcs: number; kg: number }>,
    );

    const grandTotal = Object.values(totalCases).reduce(
      (acc, item) => {
        acc.pcs += item.pcs ?? 0;
        acc.kg += item.kg ?? 0;
        return acc;
      },
      { pcs: 0, kg: 0 }, // Default nilai awal
    );

    const grandTotalFaults = Object.values(totalFaults).reduce((acc, count) => acc + count, 0);

    const ReportDocument = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.tableContainer}>
            <View style={styles.table}>
              <View style={[styles.tableRow]}>
                <View style={{ flexDirection: 'column' }}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#e0e0e0',
                      borderBottom: '1px solid black',
                    }}
                  >
                    <View>
                      <Image src={'/images/logo.png'} style={styles.logo} />
                    </View>
                    <View>
                      <Text style={styles.headerText}>PT. SAGATRADE MURNI</Text>
                      <Text style={styles.subHeaderText}>Primary Cementing Equipment</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', height: 37 }}>
                    <Text style={[styles.tableCellHeader, { width: 40 }]}>NCR No</Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 30, borderLeft: '1px solid black' }]}
                    >
                      Source Of NCR
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 60, borderLeft: '1px solid black' }]}
                    >
                      Item Description
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 60, borderLeft: '1px solid black' }]}
                    >
                      Description Of Non-Conformance
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 40, borderLeft: '1px solid black' }]}
                    >
                      PO No
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 40, borderLeft: '1px solid black' }]}
                    >
                      Work Order No
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 40, borderLeft: '1px solid black' }]}
                    >
                      Batch Qty
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'column', borderLeft: '1px solid black' }}>
                  <Text style={[styles.tableCellHeader, { width: 150 }]}>
                    Non-Conformance Report Status
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      borderBottom: '1px solid black',
                      borderTop: '1px solid black',
                    }}
                  >
                    <Text style={[styles.tableCellHeader, { width: 30 }]}>Return</Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 30, borderLeft: '1px solid black' }]}
                    >
                      Repair
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 30, borderLeft: '1px solid black' }]}
                    >
                      Rework
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 30, borderLeft: '1px solid black' }]}
                    >
                      Accept
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 30, borderLeft: '1px solid black' }]}
                    >
                      Scrap
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      display: 'flex',
                      backgroundColor: '#e0e0e0',
                      height: 37,
                    }}
                  >
                    <Text style={[styles.tableCellHeader, { width: 15 }]}>Pcs</Text>
                    <Text style={[styles.tableCellHeader, { width: 15 }]}>Kg</Text>
                    <Text
                      style={[
                        styles.tableCellHeader,
                        { width: 15, borderLeft: '1px solid black', height: 37 },
                      ]}
                    >
                      Pcs
                    </Text>
                    <Text style={[styles.tableCellHeader, { width: 15 }]}>Kg</Text>
                    <Text
                      style={[
                        styles.tableCellHeader,
                        { width: 15, borderLeft: '1px solid black', height: 37 },
                      ]}
                    >
                      Pcs
                    </Text>
                    <Text style={[styles.tableCellHeader, { width: 15 }]}>Kg</Text>
                    <Text
                      style={[
                        styles.tableCellHeader,
                        { width: 15, borderLeft: '1px solid black', height: 37 },
                      ]}
                    >
                      Pcs
                    </Text>
                    <Text style={[styles.tableCellHeader, { width: 15 }]}>Kg</Text>
                    <Text
                      style={[
                        styles.tableCellHeader,
                        { width: 15, borderLeft: '1px solid black', height: 37 },
                      ]}
                    >
                      Pcs
                    </Text>
                    <Text style={[styles.tableCellHeader, { width: 15 }]}>Kg</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'column' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      height: 41,
                      display: 'flex',
                      backgroundColor: '#e0e0e0',
                      borderBottom: '1px solid black',
                      borderLeft: '1px solid black',
                    }}
                  >
                    <Text style={[styles.tableCellHeader, { width: 50 }]}>Issued Date</Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 50, borderLeft: '1px solid black' }]}
                    >
                      Completion Date
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 50, borderLeft: '1px solid black' }]}
                    >
                      Verified Date
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      display: 'flex',
                      backgroundColor: '#e0e0e0',
                      borderLeft: '1px solid black',
                      height: 37,
                    }}
                  >
                    <Text style={[styles.tableCellHeader, { width: 50 }]}>DD/MM/YY</Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 50, borderLeft: '1px solid black' }]}
                    >
                      DD/MM/YY
                    </Text>
                    <Text
                      style={[styles.tableCellHeader, { width: 50, borderLeft: '1px solid black' }]}
                    >
                      DD/MM/YY
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'column', borderLeft: '1px solid black' }}>
                  <Text
                    style={[
                      styles.tableCellHeader,
                      { width: 195, borderBottom: '1px solid black' },
                    ]}
                  >
                    Fault Code
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'row' }}>
                      {categories.map((category) => (
                        <View
                          key={category}
                          style={{
                            width: 15,
                            height: 62,
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: 0,
                          }}
                        >
                          <Text
                            style={[
                              styles.tableCellHeader,
                              { width: 62, transform: 'rotate(-90deg)', textAlign: 'left' },
                            ]}
                          >
                            {category}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {sanitizedData.map((item: any) => (
                <View
                  wrap
                  key={item.ncrNo}
                  style={[
                    styles.tableRow,
                    {
                      display: 'flex',
                    },
                  ]}
                >
                  <Text
                    hyphenationCallback={(word) => [word]}
                    style={[styles.tableCell, { width: 40 }]}
                  >
                    {item.ncr_no.replace(/(.{8})/g, '$1 ')}
                  </Text>
                  <Text
                    style={[styles.tableCell, { width: 30 }]}
                    hyphenationCallback={(word) => [word]}
                  >
                    {item.source.replace(/(.{8})/g, '$1')}
                  </Text>
                  <Text style={[styles.tableCell, { width: 60 }]}>
                    {item.item.replace(/(.{10})/g, '$1')}
                  </Text>
                  <Text
                    style={[styles.tableCell, { width: 60 }]}
                    hyphenationCallback={(word) => [word]}
                  >
                    {item.description.replace(/(.{10})/g, '$1')}
                  </Text>
                  <Text
                    style={[styles.tableCell, { width: 40 }]}
                    hyphenationCallback={(word) => [word]}
                  >
                    {item.po_no.replace(/(.{8})/g, '$1 ')}
                  </Text>
                  <Text
                    style={[styles.tableCell, { width: 40 }]}
                    hyphenationCallback={(word) => [word]}
                  >
                    {item.wo_no.replace(/(.{8})/g, '$1 ')}
                  </Text>
                  <Text style={[styles.tableCell, { width: 40 }]}>{item.batch_qty}</Text>

                  <View style={{ flexDirection: 'row' }}>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Return_To_Supplier' ? item.pcs : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Return_To_Supplier' ? item.kg : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Repair' ? item.pcs : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Repair' ? item.kg : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Rework' ? item.pcs : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Rework' ? item.kg : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Accept_As_Is' ? item.pcs : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Accept_As_Is' ? item.kg : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Scrap' ? item.pcs : '0'}
                    </Text>
                    <Text style={[styles.tableCell, { width: 15 }]}>
                      {item.case === 'Scrap' ? item.kg : '0'}
                    </Text>
                  </View>

                  <Text style={[styles.tableCell, { width: 50 }]}>
                    {dayjs(item.issued_date).isValid()
                      ? dayjs(item.issued_date).format('MM/DD/YY')
                      : '-'}
                  </Text>
                  <Text style={[styles.tableCell, { width: 50 }]}>
                    {dayjs(item.completion_date).isValid()
                      ? dayjs(item.completion_date).format('MM/DD/YY')
                      : '-'}
                  </Text>
                  <Text style={[styles.tableCell, { width: 50 }]}>
                    {dayjs(item.verified_date).isValid()
                      ? dayjs(item.verified_date).format('MM/DD/YY')
                      : '-'}
                  </Text>

                  {categories.map((category) => {
                    const faultList = (item.fault ?? '')
                      .split(',')
                      .map((cat: string) => cat.trim().toLowerCase());

                    return (
                      <Text key={category} style={[styles.tableCell, { width: 15 }]}>
                        {faultList.some((f: any) => f === category.toLowerCase()) ? '1' : '-'}
                      </Text>
                    );
                  })}
                </View>
              ))}

              <View style={[styles.tableRow]}>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={[styles.tableCellHeader, { width: 310 }]}>Total</Text>
                </View>

                <View style={{ flexDirection: 'column' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e0e0e0',
                      height: 15,
                    }}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Return_To_Supplier']?.pcs || '0'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Return_To_Supplier']?.kg || '0'}
                      </Text>

                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Repair']?.pcs || '0'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Repair']?.kg || '0'}
                      </Text>

                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Rework']?.pcs || '0'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Rework']?.kg || '0'}
                      </Text>

                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Accept_As_Is']?.pcs || '0'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Accept_As_Is']?.kg || '0'}
                      </Text>

                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalCases['Scrap']?.pcs || '0'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          {
                            width: 15,
                            borderLeft: '1px solid black',
                            borderRight: '1px solid black',
                          },
                        ]}
                      >
                        {totalCases['Scrap']?.kg || '0'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'column' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fff',
                      height: 15,
                    }}
                  >
                    <Text style={[{ width: 150 }]}></Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'column' }}>
                  <View style={{ flexDirection: 'row' }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: '#e0e0e0',
                        height: 15,
                        display: 'flex',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Operator Error'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Programming'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Machine'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Tooling'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Inspection'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Material'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Work Order'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Drawing'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Storage'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Handling'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Sub-Contractor'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Supplier/Customer'] ?? 0}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 15.2, borderLeft: '1px solid black' },
                        ]}
                      >
                        {totalFaults['Process Method'] ?? 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.tableRow]}>
                <View
                  style={{
                    flexDirection: 'column',
                    display: 'flex',
                    justifyContent: 'center',
                    alignContent: 'center',
                    height: 30,
                    backgroundColor: '#e0e0e0',
                    borderRight: '1px solid black',
                  }}
                >
                  <Text style={[styles.tableCellHeader, { width: 310 }]}>Grand Total</Text>
                </View>

                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e0e0e0',
                      borderRight: '1px solid black',
                      height: 30,
                    }}
                  >
                    <View style={{ flexDirection: 'column' }}>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          { width: 148, height: 15, borderBottom: '1px solid black' },
                        ]}
                      >
                        {`${grandTotal.pcs} Pcs`}
                      </Text>
                      <Text
                        style={[
                          styles.tableCellHeader,
                          {
                            width: 148,
                            height: 15,
                          },
                        ]}
                      >
                        {`${grandTotal.kg} Kg`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'column' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fff',
                      height: 15,
                    }}
                  >
                    <Text style={[{ width: 150 }]}></Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'column' }}>
                  <View style={{ flexDirection: 'row' }}>
                    <View
                      style={{
                        flexDirection: 'column',
                        backgroundColor: '#e0e0e0',
                        height: 30,
                        display: 'flex',
                        justifyContent: 'center',
                        textAlign: 'center',
                        borderLeft: '1px solid black',
                      }}
                    >
                      <Text style={[styles.tableCellHeader, { width: 197.6 }]}>
                        {grandTotalFaults}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Page>
      </Document>
    );

    const blob = await pdf(ReportDocument).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    // console.error('Error generating report:', error);
  }
}

export default generateEntryReport;
