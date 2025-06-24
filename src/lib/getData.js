'use server';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getMaster = async () =>
  await prisma.master_barang.findMany({
    orderBy: {
      id: 'desc',
    },
  });

const getNCR = async () => {
  return await prisma.ncr_master.findMany({
    orderBy: {
      id: 'desc',
    },
  });
};

const generateNCRNo = async (selectedDept, selectedNcr) => {
  const deptMapping = {
    Floating: 'F',
    Cementing: 'C',
  };
  const ncrMapping = {
    Process: 'O',
    Supplier: 'S',
    ExStock: 'E',
    Customer: 'C',
  };

  const deptPrefix = deptMapping[selectedDept];
  const ncrPrefix = ncrMapping[selectedNcr];
  const prefix = `${deptPrefix}${ncrPrefix}`;

  try {
    const data = await prisma.ncr_master.findFirst({
      where: {
        ncr_no: {
          startsWith: prefix,
        },
      },
      orderBy: {
        ncr_no: 'desc',
      },
    });

    if (!data) {
      return {
        prefix,
        data: {
          ncr_no: `${prefix}:000/NCR/${new Date().getFullYear()}`,
          po_no: '-',
          wo_no: '-',
          source: 'process',
          description: '-',
          batch_qty: 0,
          item: '-',
          case: '-',
          pcs: 0,
          kg: 0,
          issue_date: '2025-02-24 10:20:25.000',
          completion_date: '2025-02-24 10:20:25.000',
          verified_date: '2025-02-24 10:20:25.000',
          fault: '-',
          lampiran: '-',
          departement: '-',
          cv: '-',
          remarks: '-',
        },
      };
    }

    return { prefix, data };
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching NCR count');
  }
};

const getNCRById = async (id) => await prisma.ncr_master.findUnique({ where: { ncr_no: id } });

const getUserAccount = async (page, itemsPerPage) => {
  const users = await prisma.user.findMany({
    skip: (page - 1) * itemsPerPage,
    take: itemsPerPage,
  });

  const total = await prisma.user.count();

  return { users, total };
};

const getUserAccountLogin = async () => await prisma.user.findMany();

const getCardek = async () => await prisma.cardek.findMany();

const getCardekFile = async () => await prisma.cardek_file.findMany();

const getFilteredNCR = async (tahun, bulan, source, departement) => {
  try {
    let startDate, endDate;

    if (bulan.includes(' - ')) {
      const [startMonth, endMonth] = bulan.split(' - ').map((m) => parseInt(m, 10));

      startDate = new Date(`${tahun}-${String(startMonth).padStart(2, '0')}-01T00:00:00.000Z`);
      endDate = new Date(`${tahun}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
    } else {
      startDate = new Date(`${tahun}-${String(bulan).padStart(2, '0')}-01T00:00:00.000Z`);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
    }

    return await prisma.ncr_master.findMany({
      where: {
        ...(source !== 'Semua'
          ? { source }
          : { source: { in: ['Supplier', 'ExStock', 'Process', 'Customer'] } }),
        ...(departement !== 'Semua' && { departement }),
        issued_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching filtered NCR data:', error);
    throw new Error('Failed to fetch filtered NCR data');
  }
};

const getInstrumentData = async () => await prisma.peminjaman_tool.findMany();

const getInstrumentDataDetail = async (id) => {
  const detailList = await prisma.peminjaman_tool_detail.findMany({
    where: { usage_no: id },
  });

  const jftNoList = detailList.map((item) => item.jft_no);

  const masterBarangList = await prisma.master_barang.findMany({
    where: {
      no_jft: {
        in: jftNoList,
      },
    },
  });

  const masterNonKalibrasiList = await prisma.master_non_kalibrasi.findMany({
    where: {
      no_jft: {
        in: jftNoList,
      },
    },
  });

  const mergedData = detailList.map((detail) => {
    const barang =
      masterBarangList.find((m) => m.no_jft === detail.jft_no) ||
      masterNonKalibrasiList.find((m) => m.no_jft === detail.jft_no);

    return {
      ...detail,
      description: barang?.description ?? '',
      size: barang?.size ?? '',
      serial_number: barang?.serial_number ?? '',
    };
  });

  return mergedData;
};

const getNonMaster = async () => await prisma.master_non_kalibrasi.findMany();

async function getLastBorrowStatus(no_jft) {
  const data = await prisma.peminjaman_tool_detail.findFirst({
    where: {
      jft_no: no_jft,
      kembali: 'Tidak',
    },
    orderBy: {
      id: 'desc',
    },
    select: {
      kembali: true,
      id: true,
    },
  });

  return data;
}

const getDetailTool = async () => await prisma.peminjaman_tool_detail.findMany();

export {
  getMaster,
  getNCR,
  generateNCRNo,
  getNCRById,
  getUserAccount,
  getUserAccountLogin,
  getCardek,
  getCardekFile,
  getFilteredNCR,
  getInstrumentData,
  getInstrumentDataDetail,
  getNonMaster,
  getLastBorrowStatus,
  getDetailTool,
};
