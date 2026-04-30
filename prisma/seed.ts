import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/medihub',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ALL_PERMISSION_IDS = [
  'roles.manage', 'users.manage', 'database.view', 'settings.manage',
  'companies.manage', 'cie10.manage', 'services.manage', 'specialties.manage',
  'people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'directory.search',
  'waitlist.manage', 'consultation.perform', 'hce.view', 'medicalhistory.view', 'blankformats.print', 'treatmentlog.manage',
  'reports.view', 'surveys.manage',
];

const DEPARTMENTS_GROUPED = [
  {
    category: "Especialidades Médicas",
    departments: [
      "Alergología", "Anatomopatología", "Anestesiología", "Cardiología",
      "Cardiología Pediátrica", "Dermatología", "Endocrinología",
      "Endocrinología Pediátrica", "Gastroenterología", "Gastroenterología Pediátrica",
      "Ginecología y Obstetricia", "Hematología", "Hematología Pediátrica",
      "Infectología", "Infectología Pediátrica", "Inmunología", "Medicina Interna",
      "Nefrología", "Nefrología Pediátrica", "Neumonología", "Neumonología Pediátrica",
      "Neurocirugía", "Neurología", "Neurología Pediátrica", "Oftalmología",
      "Oftalmología Pediátrica", "Oncología y Radioterapia", "Otorrinolaringología",
      "Pediatría", "Psiquiatría", "Reumatología", "Traumatología", "Urología",
    ],
  },
  {
    category: "Especialidades Quirúrgicas",
    departments: [
      "Cirugía Bariátrica", "Cirugía Cardiovascular", "Cirugía de la Mano",
      "Cirugía de Tórax", "Cirugía General", "Cirugía Oncológica",
      "Cirugía Pediátrica", "Cirugía Plástica", "Coloproctología",
    ],
  },
  {
    category: "Servicios de Diagnóstico y Apoyo",
    departments: [
      "Bioanálisis", "Ecografía", "Laboratorio", "Medicina Nuclear",
      "Radiología", "Rayos X", "Tomografía", "Unidad de Hemodinamia",
      "Unidosis (Farmacia Hospitalaria)",
    ],
  },
  {
    category: "Estructura Directiva y Gerencial",
    departments: [
      "Junta Directiva", "Dirección Médica", "Fundación Policlínico La Viña",
      "Sociedad Médica", "Gerencia General", "Gerencia de Seguridad Integral",
    ],
  },
  {
    category: "Departamentos Administrativos",
    departments: [
      "Recursos Humanos", "Administración y Finanzas",
      "Coordinación de Contabilidad", "Analista de Impuestos",
      "Analista de Contabilidad", "Departamento Legal", "Auditoría Interna",
      "Departamento de Compras", "Departamento de Mantenimiento",
      "Departamento de Informática",
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // --- Roles & Permissions ---
  const rolesToCreate = [
    { id: 1, name: 'Superusuario', description: 'Acceso total a todas las funciones del sistema.', hasSpecialty: false, permissions: ALL_PERMISSION_IDS },
    { id: 2, name: 'Admin', description: 'Puede gestionar usuarios, roles y configuraciones.', hasSpecialty: false, permissions: ['users.manage', 'roles.manage', 'settings.manage', 'companies.manage', 'specialties.manage', 'reports.view'] },
    { id: 3, name: 'Secretaria', description: 'Acceso a módulos de admisión y reportes básicos.', hasSpecialty: false, permissions: ['waitlist.manage', 'people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'reports.view'] },
    { id: 4, name: 'Enfermera', description: 'Puede gestionar la bitácora de tratamiento y asistir en consultas.', hasSpecialty: false, permissions: ['treatmentlog.manage', 'waitlist.manage'] },
    { id: 5, name: 'Dra. Pediatra', description: 'Rol para médico pediatra.', hasSpecialty: true, permissions: ['consultation.perform', 'hce.view', 'waitlist.manage', 'patientlist.view', 'treatmentlog.manage'] },
    { id: 6, name: 'Dra. Familiar', description: 'Rol para médico familiar.', hasSpecialty: true, permissions: ['consultation.perform', 'hce.view', 'waitlist.manage', 'patientlist.view', 'treatmentlog.manage'] },
    { id: 7, name: 'Recepcionista', description: 'Gestiona la sala de espera y el registro de pacientes.', hasSpecialty: false, permissions: ['waitlist.manage', 'people.manage', 'titulars.manage', 'beneficiaries.manage'] },
  ];

  for (const role of rolesToCreate) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: {
        id: role.id,
        name: role.name,
        description: role.description,
        hasSpecialty: role.hasSpecialty,
        permissions: {
          createMany: {
            data: role.permissions.map(p => ({ permissionId: p })),
            skipDuplicates: true,
          },
        },
      },
    });
  }
  console.log('✅ Roles seeded');

  // --- Unidades de Servicio ---
  const specialUnidades = [
    { name: 'Empleado', category: 'Tipos de Cuenta' },
    { name: 'Afiliado Corporativo', category: 'Tipos de Cuenta' },
    { name: 'Privado', category: 'Tipos de Cuenta' },
  ];

  for (const u of specialUnidades) {
    await prisma.unidadServicio.upsert({
      where: { name: u.name },
      update: {},
      create: { name: u.name, category: u.category },
    });
  }

  for (const group of DEPARTMENTS_GROUPED) {
    for (const dept of group.departments) {
      await prisma.unidadServicio.upsert({
        where: { name: dept },
        update: {},
        create: { name: dept, category: group.category },
      });
    }
  }
  console.log('✅ Unidades de Servicio seeded');

  // --- Users ---
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Superuser Persona
  const superPersona = await prisma.persona.upsert({
    where: { nacionalidad_cedulaNumero: { nacionalidad: 'V', cedulaNumero: '00000000' } },
    update: {},
    create: {
        primerNombre: 'Super',
        primerApellido: 'Administrador',
        nacionalidad: 'V',
        cedulaNumero: '00000000',
        fechaNacimiento: new Date(1980, 0, 1),
        genero: 'Masculino',
    }
  });

  await prisma.user.upsert({
    where: { username: 'superuser' },
    update: { personaId: superPersona.id },
    create: {
      id: 1,
      username: 'superuser',
      password: hashedPassword,
      roleId: 1,
      personaId: superPersona.id,
    },
  });

  // Assistant Persona
  const assistantPersona = await prisma.persona.upsert({
    where: { nacionalidad_cedulaNumero: { nacionalidad: 'V', cedulaNumero: '00000001' } },
    update: {},
    create: {
        primerNombre: 'Asistente',
        primerApellido: 'de Recepción',
        nacionalidad: 'V',
        cedulaNumero: '00000001',
        fechaNacimiento: new Date(1990, 0, 1),
        genero: 'Femenino',
    }
  });

  await prisma.user.upsert({
    where: { username: 'asistente' },
    update: { personaId: assistantPersona.id },
    create: {
      id: 2,
      username: 'asistente',
      password: hashedPassword,
      roleId: 7,
      personaId: assistantPersona.id,
    },
  });
  console.log('✅ Users seeded');

  // --- Settings ---
  await prisma.setting.upsert({
    where: { key: 'loginImage' },
    update: {},
    create: { key: 'loginImage', value: '/la-viña/cpv-la viña.png.png' },
  });
  await prisma.setting.upsert({
    where: { key: 'loginOverlayImage' },
    update: {},
    create: { key: 'loginOverlayImage', value: '/fondo-azul/fondo-azul,png.png' },
  });
  console.log('✅ Settings seeded');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
