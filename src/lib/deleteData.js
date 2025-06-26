'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const deleteMaster = async (id) => {
  try {
    const deletedRecord = await prisma.master_barang.delete({
      where: { id: id },
    });
    console.log('Record deleted:', deletedRecord);
  } catch (error) {
    console.error('Error deleting record:', error);
  } finally {
    await prisma.$disconnect();
  }
};

const deleteNonMaster = async (id) => {
  try {
    const deletedRecord = await prisma.master_non_kalibrasi.delete({
      where: { id: id },
    });
    console.log('Record deleted:', deletedRecord);
  } catch (error) {
    console.error('Error deleting record:', error);
  } finally {
    await prisma.$disconnect();
  }
};

const deleteAccountData = async (id) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      console.log('User not found');
      return;
    }

    const deletedRecord = await prisma.user.delete({
      where: { id },
    });

    console.log('Record deleted:', deletedRecord);
  } catch (error) {
    console.error('Error deleting record:', error);
  } finally {
    await prisma.$disconnect();
  }
};

const deleteCardek = async (id) => {
  try {
    if (!id) {
      throw new Error('No ID provided for deletion');
    }

    const deletedRecord = await prisma.cardek.delete({
      where: { id },
    });

    console.log('Deleted record:', deletedRecord);
    return deletedRecord;
  } catch (error) {
    console.error('Error deleting record:', error);
    throw new Error('Failed to delete record');
  }
};

const deleteNcr = async (id) => {
  try {
    if (!id) {
      throw new Error('No ID provided for deletion');
    }

    const deletedRecord = await prisma.ncr_master.delete({
      where: { ncr_no: id },
    });

    console.log('Deleted record:', deletedRecord);
    return deletedRecord;
  } catch (error) {
    console.error('Error deleting record:', error);
    throw new Error('Failed to delete record');
  }
};

const deleteInstrumentData = async (id) => {
  try {
    const deletedRecord = await prisma.peminjaman_tool.delete({
      where: { usage_no: id },
    });
    console.log('Record deleted:', deletedRecord);
  } catch (error) {
    console.error('Error deleting record:', error);
  } finally {
    await prisma.$disconnect();
  }
};

const deleteManualCardek = async (id) => {
  const deleted = await prisma.cardek_file.delete({
    where: {
      id_cardek_file: id,
    },
  });

  return deleted;
};

export {
  deleteMaster,
  deleteAccountData,
  deleteCardek,
  deleteNcr,
  deleteNonMaster,
  deleteInstrumentData,
  deleteManualCardek,
};
