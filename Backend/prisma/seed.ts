import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  client_encoding: 'UTF8',
  allowExitOnIdle: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de roles...');

  // Definir los 3 roles oficiales del sistema
  const officialRoles = ['student', 'admin', 'superadmin'];

  for (const roleName of officialRoles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {}, // No actualizar si ya existe
      create: { name: roleName },
    });

    console.log(`✅ Rol '${role.name}' asegurado en la base de datos (ID: ${role.id_role})`);
  }

  console.log('✅ Sistema de roles estandarizado: student, admin, superadmin');

  // Sembrar los 31 programas académicos
  console.log('🌱 Sembrando programas académicos...');

  const programs = [
    'Administración de Empresas Agropecuarias',
    'Administración Financiera',
    'Antropología',
    'Artes Plásticas',
    'Biología',
    'Derecho',
    'Desarrollo Familiar',
    'Diseño Visual',
    'Enfermería',
    'Geología',
    'Historia',
    'Ingeniería Agronómica',
    'Ingeniería Ambiental y Sanitaria',
    'Ingeniería de Alimentos',
    'Ingeniería de Sistemas y Computación',
    'Ingeniería en Informática',
    'Ingeniería en Inteligencia Artificial',
    'Ingeniería Mecatrónica',
    'Licenciatura en Artes Escénicas',
    'Licenciatura en Ciencias Naturales',
    'Licenciatura en Ciencias Sociales',
    'Licenciatura en Educación Física, Recreación y Deportes',
    'Licenciatura en Filosofía y Letras',
    'Licenciatura en Lenguas Modernas',
    'Licenciatura en Música',
    'Maestro en Música',
    'Medicina',
    'Medicina Veterinaria y Zootecnia',
    'Profesional en Filosofía y Letras',
    'Sociología',
    'Trabajo Social',
  ];

  for (const name of programs) {
    const existing = await prisma.program.findFirst({ where: { name } });
    if (!existing) {
      await prisma.program.create({ data: { name } });
      console.log(`✅ Programa '${name}' creado`);
    } else {
      console.log(`✅ Programa '${name}' ya existe (ID: ${existing.id_program})`);
    }
  }

  console.log('✅ Programas académicos completados');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Seed completado');
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
