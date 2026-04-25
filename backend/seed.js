const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const agentHash = await bcrypt.hash('agent123', salt);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { username: 'agent1' },
    update: {},
    create: {
      username: 'agent1',
      passwordHash: agentHash,
      role: 'AGENT',
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { username: 'agent2' },
    update: {},
    create: {
      username: 'agent2',
      passwordHash: agentHash,
      role: 'AGENT',
    },
  });

  console.log('Clearing old fields...');
  await prisma.fieldNote.deleteMany();
  await prisma.field.deleteMany();

  console.log('Creating sample Kenyan fields...');
  
  await prisma.field.create({
    data: {
      name: 'Narok Wheat',
      cropType: 'Wheat',
      plantingDate: new Date(),
      currentStage: 'PLANTED',
      agentId: agent1.id,
      notes: {
        create: [{ content: 'Soil looks optimal. Planting finished today before the short rains.', authorId: agent1.id }]
      }
    }
  });

  await prisma.field.create({
    data: {
      name: 'Trans Nzoia Maize',
      cropType: 'Maize',
      plantingDate: new Date(new Date().setDate(new Date().getDate() - 60)), 
      currentStage: 'GROWING',
      agentId: agent1.id,
      notes: {
        create: [{ content: 'Growth rate is exceptional due to recent scattered rainfall across the Rift Valley.', authorId: admin.id }]
      }
    }
  });

  await prisma.field.create({
    data: {
      name: 'Kiambu Coffee',
      cropType: 'Coffee',
      plantingDate: new Date(new Date().setDate(new Date().getDate() - 130)), 
      currentStage: 'READY',
      agentId: agent2.id,
      notes: {
        create: [{ content: 'Coffee cherries are red and ready for harvest. Awaiting picking teams to be mobilized.', authorId: agent2.id }]
      }
    }
  });

  console.log('Seeding complete!', { admin: admin.username, agent1: agent1.username, agent2: agent2.username });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
