const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.field.findMany().then(fields => console.log(JSON.stringify(fields, null, 2))).catch(e => console.error(e)).finally(() => prisma.$disconnect());
