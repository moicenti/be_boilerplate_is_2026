import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { PrismaService } from '@Prisma/services';
import { Role } from '@PrismaClient';

export const PASSWORD = 'Test1234!';

export const USERS = {
  seguridad: { email: 'guardia@test.com', role: Role.SEGURIDAD, unit: '' },
  seguridad2: { email: 'guardia2@test.com', role: Role.SEGURIDAD, unit: '' },
  admin: { email: 'admin@test.com', role: Role.ADMINISTRADOR, unit: '' },
  residente: {
    email: 'residente@test.com',
    role: Role.RESIDENTE,
    unit: 'A-304',
  },
} as const;

export type TestUser = keyof typeof USERS;

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return { app, prisma: app.get(PrismaService) };
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE packages, report_photos, reports, refresh_tokens, users, units RESTART IDENTITY CASCADE',
  );

  await prisma.unit.createMany({
    data: [
      {
        code: 'A-304',
        tower: 'Torre A',
        description: 'Torre A, departamento 304',
      },
      {
        code: 'B-103',
        tower: 'Torre B',
        description: 'Torre B, departamento 103',
      },
    ],
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  await prisma.user.createMany({
    data: Object.values(USERS).map((user) => ({ ...user, passwordHash })),
  });
}

export async function loginAs(
  app: INestApplication,
  user: TestUser,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: USERS[user].email, password: PASSWORD })
    .expect(200);
  return response.body.accessToken as string;
}
