/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma.service';

const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}@example.com`;

describe('Issue triage API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const signupAs = async (role: Role) => {
    const email = uniqueEmail(role.toLowerCase());
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'password123', name: role })
      .expect(201);

    await prisma.user.update({
      where: { id: response.body.user.id },
      data: { role },
    });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(201)
      .then((loginResponse) => loginResponse.body);
  };

  const createIssue = async (token: string) =>
    request(app.getHttpServer())
      .post('/issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Authenticated issue',
        description: 'Created through an authenticated E2E flow.',
        status: 'OPEN',
        priority: 'MEDIUM',
        category: 'Backend',
      })
      .expect(201)
      .then((response) => response.body);

  it('login returns a JWT', async () => {
    const email = uniqueEmail('login');
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'password123', name: 'Login User' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it('requires JWT for protected issue routes', async () => {
    await request(app.getHttpServer()).get('/issues').expect(401);
  });

  it('authenticated developer can create an issue', async () => {
    const developer = await signupAs(Role.DEVELOPER);
    const issue = await createIssue(developer.accessToken);

    expect(issue.createdById).toBe(developer.user.id);
    expect(issue.createdBy.email).toBe(developer.user.email);
  });

  it('viewer cannot delete an issue', async () => {
    const admin = await signupAs(Role.ADMIN);
    const viewer = await signupAs(Role.VIEWER);
    const issue = await createIssue(admin.accessToken);

    await request(app.getHttpServer())
      .delete(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(403);
  });

  it('developer cannot delete another user comment', async () => {
    const admin = await signupAs(Role.ADMIN);
    const developer = await signupAs(Role.DEVELOPER);
    const issue = await createIssue(admin.accessToken);

    const comment = await request(app.getHttpServer())
      .post(`/issues/${issue.id}/comments`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ content: 'Admin-owned comment.' })
      .expect(201)
      .then((response) => response.body);

    await request(app.getHttpServer())
      .delete(`/issues/${issue.id}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${developer.accessToken}`)
      .expect(403);
  });
});
