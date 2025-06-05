// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ['query'], // opsional
  });
}

const prisma = globalForPrisma.prisma;

module.exports = { prisma };
