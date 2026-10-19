import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  FuriganaPreference,
} from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@example.com'.toLowerCase();

  // Placeholder only. Use a real Argon2id or bcrypt hash in production.
  const dummyPasswordHash = '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash';

  const admin = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {},
    create: {
      name: 'Admin User',
      email: adminEmail,
      passwordHash: dummyPasswordHash,
      furiganaPreference: FuriganaPreference.SHOW,
    },
  });

  console.log('Admin user created/verified:', admin.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
