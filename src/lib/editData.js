'use server';

import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

function getLocalDate(offsetHours = 16) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * offsetHours);
}

function formatDateToMySQL(date) {
  const adjustedDate = new Date(date.getTime() - 8 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${adjustedDate.getFullYear()}-${pad(adjustedDate.getMonth() + 1)}-${pad(adjustedDate.getDate())} ${pad(adjustedDate.getHours())}:${pad(adjustedDate.getMinutes())}:${pad(adjustedDate.getSeconds())}`;
}

const prisma = new PrismaClient();
export async function editDataMaster(data) {
  if (!data || typeof data !== 'object') {
    console.error('Data must be a non-null object');
    throw new Error('Data must be a non-null object');
  }

  try {
    const result = await prisma.master_barang.update({
      data: {
        no_jft: data.no_jft || null,
        size: data.size || null,
        description: data.description || null,
        serial_number: data.serial_number || null,
        store_by: data.store_by || null,
        calibration_source: data.calibration_source || null,
        frequency: data.frequency + ' ' + data.unit || null,
        degree_usage: data.degree_usage || null,
        calibration_date: data.calibration_date ? new Date(data.calibration_date) : null,
        next_calibration: data.next_calibration ? new Date(data.next_calibration) : null,
        ref_criteria: data.ref_criteria || null,
        lampiran: data.lampiran || null,
        status: data.status || null,
        keterangan: data.keterangan || null,
        modify_at: getLocalDate().toISOString(),
        modify_by: data.users || null,
      },
      where: {
        id: data.id,
      },
    });

    return { result };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function perpanjangDataMaster(data) {
  if (!data || typeof data !== 'object') {
    console.error('Data must be a non-null object');
    throw new Error('Data must be a non-null object');
  }

  try {
    const result = await prisma.master_barang.update({
      data: {
        no_jft: data.no_jft || null,
        size: data.size || null,
        description: data.description || null,
        serial_number: data.serial_number || null,
        store_by: data.store_by || null,
        calibration_source: data.calibration_source || null,
        frequency: data.frequency || null,
        degree_usage: data.degree_usage || null,
        calibration_date: data.calibration_date ? new Date(data.calibration_date) : null,
        next_calibration: data.next_calibration ? new Date(data.next_calibration) : null,
        ref_criteria: data.ref_criteria || null,
        lampiran: data.lampiran || null,
        status: data.status || null,
        keterangan: data.keterangan || null,
      },
      where: {
        id: data.id,
      },
    });

    const resultCardeck = await prisma.cardek.create({
      data: {
        jft_no: data.no_jft || null,
        cal_date: data.calibration_date ? new Date(data.calibration_date) : null,
        rept_no: data.cir_no || null,
        sert_no: data.sert_no || null,
        cal_location: data.cal_location || null,
        cal_name: data.cal_name || null,
        lampiran: data.lampiran || null,
        create_at: getLocalDate().toISOString(),
        create_by: data.users,
      },
    });

    return { result, resultCardeck };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function editAccountData(data) {
  if (!data || typeof data !== 'object') {
    console.error('Data must be a non-null object');
    throw new Error('Data must be a non-null object');
  }

  try {
    const result = await prisma.user.update({
      data: {
        username: data.username || null,
        password: data.password || null,
        hak_akses: data.hak_akses || null,
        user_level: data.user_level || null,
        departemen: data.departemen || null,
        pc_name: data.pc_name || null,
        peminjaman: 0,
        image: data.image || null,
      },
      where: {
        id: data.id,
      },
    });
    return result;
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function editNcrData(data) {
  try {
    const formattedData = {
      ncr_no: data.ncr_no || '-',
      source: data.source || null,
      item: data.item || null,
      description: data.description || null,
      po_no: data.po_no || '-',
      wo_no: data.wo_no || '-',
      batch_qty: isNaN(parseInt(data.batch_qty)) ? 1 : parseInt(data.batch_qty),
      case: data.case || null,
      pcs: isNaN(parseInt(data.pcs)) ? 0 : parseInt(data.pcs),
      kg: isNaN(parseFloat(data.kg)) ? 0 : parseFloat(data.kg),
      issued_date: data.issued_date ? new Date(data.issued_date) : new Date(),
      completion_date: data.completion_date ? new Date(data.completion_date) : null,
      verified_date: data.verified_date ? new Date(data.verified_date) : null,
      fault: data.fault || '',
      departement: data.departement || '-',
      cv: data.cv || 'no',
      remarks: data.remarks || '-',
      modify_at: formatDateToMySQL(getLocalDate()),
      modify_by: data.users || null,
    };

    if (data.lampiran !== undefined) {
      formattedData.lampiran = data.lampiran;
    }

    if (!formattedData.ncr_no || !formattedData.issued_date) {
      throw new Error('Data NCR tidak lengkap.');
    }

    const result = await prisma.ncr_master.update({
      where: { ncr_no: data.ncr_no },
      data: formattedData,
    });
    return result;
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function editReturnData(data) {
  console.log(data);
  try {
    function formatDateToSQLString(date) {
      const pad = (n) => n.toString().padStart(2, '0');

      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    const tglKembaliString = data.tgl_kembali
      ? formatDateToSQLString(new Date(data.tgl_kembali))
      : undefined;

    const updated = await prisma.peminjaman_tool.update({
      where: {
        usage_no: data.usage_no,
      },
      data: {
        user_return: data.payroll_id_operator + ' - ' + data.payroll_name_operator,
        tgl_kembali: tglKembaliString,
        return_by: data.return_by,
        status: data.status,
        image_return: data.imageUrl,
      },
    });

    const detailKey = Object.keys(data.detail || {})[0];
    const detailArray = data.detail?.[detailKey] || [];

    for (const item of detailArray) {
      if (!item || item.id == null) {
        continue;
      }

      const result = await prisma.peminjaman_tool_detail.updateMany({
        where: {
          id: Number(item.id),
        },
        data: {
          kembali: item.return ? 'Ya' : 'Tidak',
          kondisi: item.good ? 'Baik' : 'Baik',
          kondisi2: item.nc ? 'NC' : 'Baik',
        },
      });
    }

    return updated;
  } catch (error) {
    throw new Error(error.message || 'Unknown error');
  }
}

const editDeleteData = async (data) => {
  console.log(data);
  try {
    const result = await prisma.master_barang.update({
      where: {
        id: data,
      },
      data: {
        deleted: 1,
      },
    });
    return result;
  } catch (error) {
    throw error;
  }
};

export {
  editDataMaster,
  perpanjangDataMaster,
  editAccountData,
  editNcrData,
  editReturnData,
  editDeleteData,
};
