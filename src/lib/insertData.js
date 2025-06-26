'use server';

import prisma from './db';

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

const insertDataMaster = async (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be a non-null object');
  }

  try {
    const insertMaster = await prisma.$executeRawUnsafe(
      `
      INSERT INTO master_barang (no_jft, size, description, serial_number, store_by, calibration_source, frequency, degree_usage, calibration_date, next_calibration, ref_criteria, lampiran, status, keterangan, bulan, tahun, create_at, create_by) 
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, now() ,?)`,
      data.no_jft,
      data.size,
      data.description,
      data.serial_number,
      data.store_by,
      data.calibration_source,
      data.frequency + ' ' + data.unit,
      data.degree_usage,
      data.calibration_date,
      data.next_calibration,
      data.ref_criteria,
      data.lampiran,
      data.status,
      data.keterangan,
      data.bulan,
      data.tahun,
      data.users,
    );

    return { insertMaster };
  } catch (error) {
    throw new Error(error.message);
  }
};

const insertDataNonMaster = async (data) => {
  try {
    if (!data || typeof data !== 'object') {
      console.error('🚨 Data bukan object:', data);
      throw new Error('The "payload" argument must be of type object. Received null');
    }
    const resultNonMaster = await prisma.master_non_kalibrasi.create({
      data: {
        no_jft: data.no_jft,
        size: data.size,
        description: data.description,
        serial_number: data.serial_number,
        store_by: data.store_by,
        note: data.keterangan,
        check: new Date(data.check),
        next: new Date(data.next),
        jenis: data.jenis,
        create_by: data.users,
        create_at: getLocalDate(),
      },
    });

    return { resultNonMaster };
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to insert data');
  }
};

const insertNcrData = async (data) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Data yang dikirim tidak valid.');
    }

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
      lampiran: data.lampiran || '-',
      departement: data.departement || '-',
      cv: data.cv || 'no',
      remarks: data.remarks || '-',
      create_at: formatDateToMySQL(getLocalDate()),
      create_by: data.users,
    };

    if (!formattedData.ncr_no || !formattedData.issued_date) {
      throw new Error('Data NCR tidak lengkap.');
    }

    console.log(formattedData);

    const result = await prisma.ncr_master.create({
      data: formattedData,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const insertAccountData = async (data) => {
  try {
    const formData = {
      username: data.username || '',
      password: data.password || '',
      hak_akses: data.hak_akses || '',
      user_level: data.user_level || '',
      departemen: data.departemen || '',
      pc_name: data.pc_name || '',
      peminjaman: data.peminjaman || 0,
      image: data.image || '',
      create_at: getLocalDate(),
      create_by: data.users,
    };

    const result = await prisma.user.create({
      data: formData,
    });
    return result;
  } catch (error) {
    throw error;
  }
};

const insertDataInstrument = async (data) => {
  try {
    const tgl_diterima = data.issued_date ? new Date(data.issued_date) : null;
    const est_return_date = data.est_return_date ? new Date(data.est_return_date) : null;

    const bulan = tgl_diterima ? (tgl_diterima.getMonth() + 1).toString().padStart(2, '0') : null;
    const tahun = tgl_diterima ? tgl_diterima.getFullYear().toString() : null;

    const batch_qty = data.batch_qty ? parseInt(data.batch_qty, 10) || null : null;

    const result = await prisma.peminjaman_tool.create({
      data: {
        usage_no: data.usage_no || '',
        no_payroll: data.payroll_id_operator || '',
        nama: data.payroll_name_operator || '',
        dept: data.payroll_departement_operator || '',
        wo_refer_to: data.wo_refer_to || '',
        tgl_diterima,
        bulan,
        tahun,
        est_return_date,
        batch_qty,
        location: data.location || '',
        image: data.imageUrl || '',
        issued_by: data.payroll_id + ' - ' + data.payroll_name || '',
        create_at: getLocalDate(),
        create_by: data.users,
      },
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const insertDetailPeminjaman = async (usage_no, scannedData) => {
  try {
    const detailData = scannedData.map((item) => {
      return {
        usage_no,
        jft_no: item.jft_no ?? null,
        kembali: 'Tidak',
        create_at: getLocalDate(),
        create_by: scannedData[0]?.users,
      };
    });

    await prisma.peminjaman_tool_detail.createMany({
      data: detailData,
      skipDuplicates: true,
    });

    return detailData;
  } catch (error) {
    throw error;
  }
};

const insertManualCardek = async (data) => {
  try {
    const result = await prisma.cardek_file.create({
      data: {
        jft_no: data.jft_no,
        file: data.file,
      },
    });
    return result;
  } catch (error) {
    throw error;
  }
};

export {
  insertDataMaster,
  insertNcrData,
  insertAccountData,
  insertDataInstrument,
  insertDetailPeminjaman,
  insertDataNonMaster,
  insertManualCardek,
};
