import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { getFilteredNCR } from '@/lib/getData';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10, fontFamily: 'Times-Roman' },
  container: { borderWidth: 1, borderColor: '#000' },
  headerContainerBox: {
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderContainerBox: { borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#000' },
  containerContent: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  secContainerContent: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 29,
    borderTopWidth: 1,
    borderColor: '#000',
  },
  headerContainer: { textAlign: 'center' },
  subHeaderContainer: {
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: '#ccc',
    paddingVertical: 5,
  },
  header: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  secHeader: { fontSize: 16, fontWeight: 'bold', fontStyle: 'italic', marginHorizontal: 'auto' },
  subHeader: { fontSize: 16, fontWeight: 'bold', textDecoration: 'underline' },
  section: { marginBottom: 12 },
  boldText: { fontWeight: 'bold', textDecoration: 'underline' },
  text: { textAlign: 'justify', fontSize: 14, lineHeight: 1.2 },
  details: { marginVertical: 15, fontSize: 14, textAlign: 'justify', lineHeight: 1.2 },
  detailsDisposition: { marginBottom: 10, fontSize: 14, textAlign: 'justify', lineHeight: 1.2 },
  signature: {
    marginTop: 80,
    fontSize: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: { width: 40, height: 40, alignSelf: 'center', marginHorizontal: 5 },
});

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

const getMonthPeriod = (monthString: string) => {
  const months = monthString.split(' - ').map((m) => parseInt(m, 10));
  if (months.length === 1) {
    return `${monthNames[months[0] - 1]} ${new Date().getFullYear()}`;
  } else if (months.length === 2) {
    return `${monthNames[months[0] - 1]} - ${monthNames[months[1] - 1]} ${new Date().getFullYear()}`;
  }
  return '';
};

const getHighestCase = (caseCounts: any) => {
  return Object.keys(caseCounts).reduce((a, b) => (caseCounts[a] > caseCounts[b] ? a : b));
};

const getHighestCaseMonth = (filteredData: any[]) => {
  const casePerMonth: Record<string, number> = {};

  filteredData.forEach((item) => {
    const month = monthNames[new Date(item.issued_date).getMonth()];
    casePerMonth[month] = (casePerMonth[month] || 0) + 1;
  });

  const maxCase = Math.max(...Object.values(casePerMonth));
  const monthsWithHighestCase = Object.keys(casePerMonth)
    .filter((month) => casePerMonth[month] === maxCase)
    .join(' and ');

  return monthsWithHighestCase;
};

const getHighestPcsMonth = (filteredData: any[]) => {
  const pcsPerMonth: Record<string, number> = {};

  filteredData.forEach((item) => {
    const month = monthNames[new Date(item.issued_date).getMonth()];
    pcsPerMonth[month] = (pcsPerMonth[month] || 0) + item.pcs;
  });

  const maxPcs = Math.max(...Object.values(pcsPerMonth));
  const monthsWithHighestPcs = Object.keys(pcsPerMonth)
    .filter((month) => pcsPerMonth[month] === maxPcs)
    .join(' and ');

  return monthsWithHighestPcs;
};

const getHighestFaultMonth = (faultCountsPerMonth: Record<string, Record<string, number>>) => {
  let highestMonth = '';
  let maxFaults = 0;

  Object.keys(faultCountsPerMonth).forEach((month) => {
    const totalFaults = Object.values(faultCountsPerMonth[month]).reduce(
      (sum, val) => sum + val,
      0,
    );

    if (totalFaults > maxFaults) {
      maxFaults = totalFaults;
      highestMonth = month;
    }
  });

  return highestMonth;
};

const getHighestFaultCategoriesInMonth = (
  faultCountsPerMonth: Record<string, Record<string, number>>,
  highestMonth: string,
) => {
  if (!highestMonth || !faultCountsPerMonth[highestMonth]) return 'No data';

  const faultCounts = faultCountsPerMonth[highestMonth];
  const maxCount = Math.max(...Object.values(faultCounts));
  const highestCategories = Object.keys(faultCounts).filter(
    (category) => faultCounts[category] === maxCount,
  );

  return highestCategories.join(' and ');
};

const getHighestFaultCountInMonth = (
  faultCountsPerMonth: Record<string, Record<string, number>>,
  highestMonth: string,
) => {
  if (!highestMonth || !faultCountsPerMonth[highestMonth]) return 0;

  return Object.values(faultCountsPerMonth[highestMonth]).reduce((sum, val) => sum + val, 0);
};

const getHighestCaseCount = (caseCounts: Record<string, number>) => {
  return Math.max(...Object.values(caseCounts).map(Number));
};

const getHighestFaultCount = (faultCounts: Record<string, number>) => {
  return Math.max(...Object.values(faultCounts));
};

const getHighestPcsMonthCount = (filteredData: any[]) => {
  const pcsPerCategoryPerMonth: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const month = monthNames[new Date(item.issued_date).getMonth()];
    const category = item.case;

    if (!pcsPerCategoryPerMonth[month]) {
      pcsPerCategoryPerMonth[month] = {};
    }

    pcsPerCategoryPerMonth[month][category] =
      (pcsPerCategoryPerMonth[month][category] || 0) + item.pcs;
  });

  let highestPcs = 0;

  Object.values(pcsPerCategoryPerMonth).forEach((categories) => {
    const maxCategoryPcs = Math.max(...Object.values(categories));
    if (maxCategoryPcs > highestPcs) {
      highestPcs = maxCategoryPcs;
    }
  });

  return highestPcs;
};

const getHighestPcsCategory = (pcsCounts: Record<string, number>) => {
  return Object.keys(pcsCounts).reduce((a, b) => (pcsCounts[a] > pcsCounts[b] ? a : b));
};

const getFaultCountsPerMonth = (filteredData: any[]) => {
  const faultCountsPerMonth: Record<string, Record<string, number>> = {};

  filteredData.forEach((item) => {
    const issueMonth = new Date(item.issued_date).toLocaleString('en-US', { month: 'long' });

    if (!faultCountsPerMonth[issueMonth]) {
      faultCountsPerMonth[issueMonth] = {};
    }

    const faultList = (item.fault ?? '').split(',').map((f: string) => f.trim());

    faultList.forEach((fault: any) => {
      faultCountsPerMonth[issueMonth][fault] = (faultCountsPerMonth[issueMonth][fault] || 0) + 1;
    });
  });

  return faultCountsPerMonth;
};

export async function generateDefectReport(data: any) {
  try {
    const filteredData = await getFilteredNCR(
      data.tahun,
      data.bulan,
      data.source,
      data.departement,
    );

    const totalPcs = filteredData.reduce((sum, item) => sum + (item.pcs || 0), 0);
    const monthPeriod = getMonthPeriod(data.bulan);

    const caseCounts = {
      Return_To_Supplier: filteredData.filter(
        (item) => (item.case as string) === 'Return_To_Supplier',
      ).length,
      Repair: filteredData.filter((item) => (item.case as string) === 'Repair').length,
      Rework: filteredData.filter((item) => (item.case as string) === 'Rework').length,
      Accept_As_Is: filteredData.filter((item) => (item.case as string) === 'Accept_As_Is').length,
      Scrap: filteredData.filter((item) => (item.case as string) === 'Scrap').length,
    };

    const pcsCounts = filteredData.reduce(
      (acc, item) => {
        const caseType = item.case ?? 'Unknown';
        const pcsValue = item.pcs ?? 0;

        acc[caseType] = (acc[caseType] || 0) + pcsValue;
        return acc;
      },
      {
        Return_To_Supplier: 0,
        Repair: 0,
        Rework: 0,
        Scrap: 0,
        Accept_As_Is: 0,
      } as Record<string, number>,
    );

    const faultCategories = [
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

    const faultCounts = faultCategories.reduce(
      (acc, category) => {
        acc[category] = 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    filteredData.forEach((item) => {
      if (item.fault) {
        const faults = item.fault.split(',').map((f) => f.trim());
        faults.forEach((fault) => {
          if (fault in faultCounts) {
            faultCounts[fault] += 1;
          }
        });
      }
    });

    const totalFaults = Object.values(faultCounts).reduce((sum, count) => sum + count, 0);

    const totalCases = Object.values(caseCounts).reduce((sum, count) => sum + count, 0);

    const faultCountsPerMonth = getFaultCountsPerMonth(filteredData);

    const highestFaultMonth = getHighestFaultMonth(faultCountsPerMonth);

    const highestFaultCategories = getHighestFaultCategoriesInMonth(
      faultCountsPerMonth,
      highestFaultMonth,
    );

    const highestFaultCount = Math.max(...Object.values(faultCountsPerMonth[highestFaultMonth]));

    const formatCaseName = (caseName: string) => {
      return caseName.replace(/_/g, ' ');
    };

    const pdfDoc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.container}>
            <View style={[styles.headerContainer, styles.headerContainerBox]}>
              <View>
                <Image src="/images/logo.png" style={styles.logo} />
              </View>
              <View>
                <Text style={styles.header}>PT. SAGATRADE MURNI</Text>
                <Text style={styles.secHeader}>Primary Cementing Equipment</Text>
              </View>
            </View>
            <View style={[styles.subHeaderContainer, styles.subHeaderContainerBox]}>
              <Text style={styles.subHeader}>Defect Analysis For Customer</Text>
              <Text style={styles.subHeader}>
                <Text style={styles.subHeader}>
                  On {monthPeriod} From {data.departement === 'Semua' ? 'All' : data.departement}{' '}
                  Dept.
                </Text>
              </Text>
            </View>
            <View style={[styles.containerContent]}>
              <View style={[styles.section, styles.text]}>
                <Text style={styles.boldText}>DETAIL OF DEFECT:</Text>
                <Text>
                  Refer to NCR Customer for{' '}
                  {data.departement === 'Semua' ? 'All' : data.departement} Dept. period,{' '}
                  {monthPeriod}
                </Text>
              </View>

              <View style={[styles.section, styles.text]}>
                <Text style={styles.boldText}>
                  Totally NCR Customer refer to Total Case is {totalCases} Cases.
                </Text>
                <Text>
                  Consist of : Return To Supplier = {caseCounts['Return_To_Supplier']}{' '}
                  {caseCounts['Return_To_Supplier'] <= 1 ? 'Case' : 'Cases'}, Repair ={' '}
                  {caseCounts['Repair']} {caseCounts['Repair'] <= 1 ? 'Case' : 'Cases'}, Rework ={' '}
                  {caseCounts['Rework']} {caseCounts['Rework'] <= 1 ? 'Case' : 'Cases'}, Scrap ={' '}
                  {caseCounts['Scrap']} {caseCounts['Scrap'] <= 1 ? 'Case' : 'Cases'}, Accept As Is
                  = {caseCounts['Accept_As_Is']}{' '}
                  {caseCounts['Accept_As_Is'] <= 1 ? 'Case' : 'Cases'}.
                </Text>

                <Text>
                  The highest status for {monthPeriod} is{' '}
                  {formatCaseName(getHighestCase(caseCounts))}, it happened in{' '}
                  {getHighestCaseMonth(filteredData)} with total {getHighestCaseCount(caseCounts)}{' '}
                  Cases.
                </Text>
              </View>

              <View style={[styles.section, styles.text]}>
                <Text style={styles.boldText}>
                  Totally of NCR Customer refer to Total Pcs is {totalPcs} Pcs.
                </Text>
                <Text>
                  Consist of : Return To Supplier = {pcsCounts['Return_To_Supplier']}{' '}
                  {pcsCounts['Return_To_Supplier'] <= 1 ? 'Pc' : 'Pcs'}, Repair ={' '}
                  {pcsCounts['Repair']} {pcsCounts['Repair'] <= 1 ? 'Pc' : 'Pcs'}, Rework ={' '}
                  {pcsCounts['Rework']} {pcsCounts['Rework'] <= 1 ? 'Pc' : 'Pcs'}, Scrap ={' '}
                  {pcsCounts['Scrap']} {pcsCounts['Scrap'] <= 1 ? 'Pc' : 'Pcs'}, Accept As Is ={' '}
                  {pcsCounts['Accept_As_Is']} {pcsCounts['Accept_As_Is'] <= 1 ? 'Pc' : 'Pcs'}.
                </Text>

                <Text>
                  The highest status for {monthPeriod} is{' '}
                  {formatCaseName(getHighestPcsCategory(pcsCounts))}, it happened in{' '}
                  {getHighestPcsMonth(filteredData)} with total{' '}
                  {getHighestPcsMonthCount(filteredData)} Pcs.
                </Text>
              </View>

              <View style={[styles.section, styles.text]}>
                <Text style={styles.boldText}>
                  Totally of NCR Customer refer to Quantity of Faults is {totalFaults} Faults.
                </Text>

                <Text>
                  Consist of :{' '}
                  {faultCategories
                    .map(
                      (category) =>
                        `${category} = ${faultCounts[category]} Fault${faultCounts[category] <= 1 ? '' : 's'}`,
                    )
                    .join(', ')}
                </Text>

                <Text>
                  The highest fault category for {monthPeriod} is {highestFaultCategories}, it
                  happened in {highestFaultMonth} with total {highestFaultCount} Faults.
                </Text>
              </View>

              <View style={[styles.details]}>
                <Text>
                  For detail of report please see the Non Conformance register on attachment
                </Text>
              </View>

              <View style={styles.signature}>
                <Text>Prepared by: ___________________</Text>
                <Text>Reviewed by: ___________________</Text>
                <Text>Date: ____________________</Text>
              </View>
            </View>
            <View style={[styles.secContainerContent]}>
              <View>
                <Text style={[styles.boldText, styles.detailsDisposition]}>
                  DISPOSITION INSTRUCTION :
                </Text>
              </View>
              <View style={styles.signature}>
                <Text>Sign by: ____________________</Text>
                <Text>Date: _____________________</Text>
              </View>
            </View>
          </View>
        </Page>
      </Document>
    );

    const pdfBlob = await pdf(pdfDoc).toBlob();
    const pdfURL = URL.createObjectURL(pdfBlob);
    window.open(pdfURL, '_blank');
  } catch (error) {
    console.error('Error generating defect report:', error);
  }
}
