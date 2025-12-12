'use server';

import { Pool, PoolClient, QueryResult } from 'pg';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS } from './permissions';

let pool: Pool | null = null;

// Wrapper interface to match existing SQLite usage
export interface Database {
    get(sql: string, params?: any[]): Promise<any>;
    all(sql: string, params?: any[]): Promise<any[]>;
    run(sql: string, params?: any[]): Promise<{ changes: number; lastID?: any }>;
    exec(sql: string): Promise<void>;
}

// Helper to convert SQLite params (?) to Postgres params ($1, $2, etc)
function preprocessQuery(sql: string, params?: any[]): { text: string; values: any[] } {
    if (!params) return { text: sql, values: [] };

    let paramIndex = 1;
    // Replace ? with $1, $2, etc. securely.
    // Note: This regex assumes ? is not used inside string literals. 
    // Given the codebase uses parameterized queries, this is a reasonable assumption for migration.
    const text = sql.replace(/\?/g, () => `$${paramIndex++}`);
    return { text, values: params };
}

class PostgresWrapper implements Database {
    private client: Pool | PoolClient;

    constructor(client: Pool | PoolClient) {
        this.client = client;
    }

    async get(sql: string, params?: any[]): Promise<any> {
        const { text, values } = preprocessQuery(sql, params);
        const res = await this.client.query(text, values);
        return res.rows[0];
    }

    async all(sql: string, params?: any[]): Promise<any[]> {
        const { text, values } = preprocessQuery(sql, params);
        const res = await this.client.query(text, values);
        return res.rows;
    }

    async run(sql: string, params?: any[]): Promise<{ changes: number; lastID?: any }> {
        const { text, values } = preprocessQuery(sql, params);
        const res = await this.client.query(text, values);
        return { changes: res.rowCount || 0 };
    }

    async exec(sql: string): Promise<void> {
        await this.client.query(sql);
    }
}

async function initializeDb() {
    if (!process.env.POSTGRES_URL) {
        throw new Error('POSTGRES_URL environment variable is not defined');
    }

    const isLocalhost = process.env.POSTGRES_URL?.includes('localhost') || process.env.POSTGRES_URL?.includes('127.0.0.1');

    const newPool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        // Disable SSL for localhost, enable for remote production databases
        ssl: !isLocalhost && process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    const client = await newPool.connect();
    try {
        await createTables(client);
        await seedDb(client);
    } finally {
        client.release();
    }

    return newPool;
}

export async function getDb(): Promise<Database> {
    if (!pool) {
        pool = await initializeDb();
    }
    return new PostgresWrapper(pool);
}


async function createTables(client: PoolClient): Promise<void> {
    // Postgres doesn't support multiple statements in one query() call easily unless configured usually, 
    // but pg supports it. However, it's safer to run schema commands sequentially or in a block.
    // Also, type mapping: INTEGER -> INTEGER is fine. TEXT -> TEXT is fine.

    await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            "hasSpecialty" INTEGER NOT NULL DEFAULT 0
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
            "roleId" TEXT NOT NULL,
            "permissionId" TEXT NOT NULL,
            PRIMARY KEY ("roleId", "permissionId"),
            FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS specialties (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS personas (
            id TEXT PRIMARY KEY,
            "primerNombre" TEXT NOT NULL,
            "segundoNombre" TEXT,
            "primerApellido" TEXT NOT NULL,
            "segundoApellido" TEXT,
            nacionalidad TEXT,
            "cedulaNumero" TEXT,
            "fechaNacimiento" TEXT NOT NULL,
            genero TEXT NOT NULL,
            telefono1 TEXT,
            telefono2 TEXT,
            email TEXT,
            direccion TEXT,
            "representanteId" TEXT,
            "createdAt" TEXT,
            UNIQUE(nacionalidad, "cedulaNumero"),
            FOREIGN KEY ("representanteId") REFERENCES personas(id) ON DELETE SET NULL
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            "roleId" TEXT NOT NULL,
            "specialtyId" TEXT,
            "personaId" TEXT UNIQUE,
            FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE RESTRICT,
            FOREIGN KEY ("specialtyId") REFERENCES specialties(id) ON DELETE SET NULL,
            FOREIGN KEY ("personaId") REFERENCES personas(id) ON DELETE SET NULL
        );
    `);

    // Add the 'name' column to the 'users' table if it doesn't exist.
    // Postgres way to check column
    const checkCol = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='name'
    `);

    if (checkCol.rows.length === 0) {
        await client.query('ALTER TABLE users ADD COLUMN name TEXT');
    }

    await client.query(`
        CREATE TABLE IF NOT EXISTS empresas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rif TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            direccion TEXT NOT NULL
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS pacientes (
            id TEXT PRIMARY KEY,
            "personaId" TEXT NOT NULL UNIQUE,
            FOREIGN KEY ("personaId") REFERENCES personas(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS titulares (
            id TEXT PRIMARY KEY,
            "personaId" TEXT NOT NULL UNIQUE,
            "unidadServicio" TEXT NOT NULL,
            "numeroFicha" TEXT,
            FOREIGN KEY ("personaId") REFERENCES personas(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS beneficiarios (
            id TEXT PRIMARY KEY,
            "personaId" TEXT NOT NULL,
            "titularId" TEXT NOT NULL,
            UNIQUE("personaId", "titularId"),
            FOREIGN KEY ("personaId") REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY ("titularId") REFERENCES titulares(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS waitlist (
            id TEXT PRIMARY KEY,
            "personaId" TEXT NOT NULL,
            "pacienteId" TEXT NOT NULL,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            "serviceType" TEXT NOT NULL,
            "accountType" TEXT NOT NULL,
            status TEXT NOT NULL,
            "checkInTime" TEXT NOT NULL,
            "appointmentid" TEXT, 
            FOREIGN KEY ("personaId") REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY ("pacienteId") REFERENCES pacientes(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS consultations (
            id TEXT PRIMARY KEY,
            "pacienteId" TEXT NOT NULL,
            "waitlistId" TEXT,
            "consultationDate" TEXT NOT NULL,
            "motivoConsulta" TEXT,
            "enfermedadActual" TEXT,
            "revisionPorSistemas" TEXT,
            "antecedentesPersonales" TEXT,
            "antecedentesFamiliares" TEXT,
            "antecedentesGinecoObstetricos" TEXT,
            "antecedentesPediatricos" TEXT,
            "signosVitales" TEXT,
            "examenFisicoGeneral" TEXT,
            "treatmentPlan" TEXT,
            "radiologyOrders" TEXT,
            "surveyInvitationToken" TEXT,
            reposo TEXT,
            FOREIGN KEY ("pacienteId") REFERENCES pacientes(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS consultation_diagnoses (
            id TEXT PRIMARY KEY,
            "consultationId" TEXT NOT NULL,
            "cie10Code" TEXT NOT NULL,
            "cie10Description" TEXT NOT NULL,
            FOREIGN KEY ("consultationId") REFERENCES consultations(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS consultation_documents (
            id TEXT PRIMARY KEY,
            "consultationId" TEXT NOT NULL,
            "fileName" TEXT NOT NULL,
            "fileType" TEXT NOT NULL,
            "documentType" TEXT NOT NULL,
            description TEXT,
            "fileData" TEXT NOT NULL,
            "uploadedAt" TEXT NOT NULL,
            FOREIGN KEY ("consultationId") REFERENCES consultations(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS cie10_codes (
            code TEXT PRIMARY KEY,
            description TEXT NOT NULL
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS treatment_orders (
            id TEXT PRIMARY KEY,
            "pacienteId" TEXT NOT NULL,
            "consultationId" TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente', 
            "createdAt" TEXT NOT NULL,
            FOREIGN KEY ("pacienteId") REFERENCES pacientes(id) ON DELETE CASCADE,
            FOREIGN KEY ("consultationId") REFERENCES consultations(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS treatment_order_items (
            id TEXT PRIMARY KEY,
            "treatmentOrderId" TEXT NOT NULL,
            "medicamentoProcedimiento" TEXT NOT NULL,
            dosis TEXT,
            via TEXT,
            frecuencia TEXT,
            duracion TEXT,
            instrucciones TEXT,
            status TEXT NOT NULL DEFAULT 'Pendiente', 
            FOREIGN KEY ("treatmentOrderId") REFERENCES treatment_orders(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS treatment_executions (
            id TEXT PRIMARY KEY,
            "treatmentOrderItemId" TEXT NOT NULL,
            "executionTime" TEXT NOT NULL,
            observations TEXT NOT NULL,
            "executedBy" TEXT NOT NULL,
            FOREIGN KEY ("treatmentOrderItemId") REFERENCES treatment_order_items(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS lab_orders (
            id TEXT PRIMARY KEY,
            "pacienteId" TEXT NOT NULL,
            "consultationId" TEXT NOT NULL,
            "orderDate" TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente',
            FOREIGN KEY ("pacienteId") REFERENCES pacientes(id) ON DELETE CASCADE,
            FOREIGN KEY ("consultationId") REFERENCES consultations(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS lab_order_items (
            id TEXT PRIMARY KEY,
            "labOrderId" TEXT NOT NULL,
            "testName" TEXT NOT NULL,
            FOREIGN KEY ("labOrderId") REFERENCES lab_orders(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS surveys (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            "isActive" INTEGER NOT NULL DEFAULT 1,
            "createdAt" TEXT NOT NULL
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS survey_questions (
            id TEXT PRIMARY KEY,
            "surveyId" TEXT NOT NULL,
            "questionText" TEXT NOT NULL,
            "questionType" TEXT NOT NULL,
            "displayOrder" INTEGER NOT NULL,
            FOREIGN KEY ("surveyId") REFERENCES surveys(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS survey_invitations (
            token TEXT PRIMARY KEY,
            "consultationId" TEXT NOT NULL UNIQUE,
            "surveyId" TEXT NOT NULL,
            "isCompleted" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TEXT NOT NULL,
            FOREIGN KEY ("consultationId") REFERENCES consultations(id) ON DELETE CASCADE,
            FOREIGN KEY ("surveyId") REFERENCES surveys(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS survey_responses (
            id TEXT PRIMARY KEY,
            "invitationToken" TEXT NOT NULL,
            "questionId" TEXT NOT NULL,
            "answerValue" TEXT,
            "submittedAt" TEXT NOT NULL,
            FOREIGN KEY ("invitationToken") REFERENCES survey_invitations(token) ON DELETE CASCADE,
            FOREIGN KEY ("questionId") REFERENCES survey_questions(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            price REAL NOT NULL
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            "consultationId" TEXT NOT NULL UNIQUE,
            "totalAmount" REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente',
            "createdAt" TEXT NOT NULL,
            FOREIGN KEY ("consultationId") REFERENCES consultations(id) ON DELETE CASCADE
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS invoice_items (
            id TEXT PRIMARY KEY,
            "invoiceId" TEXT NOT NULL,
            "serviceId" TEXT NOT NULL,
            "serviceName" TEXT NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY ("invoiceId") REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY ("serviceId") REFERENCES services(id) ON DELETE RESTRICT
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS occupational_health_evaluations (
            id TEXT PRIMARY KEY,
            "personaId" TEXT NOT NULL,
            "companyId" TEXT,
            "companyName" TEXT,
            "evaluationDate" TEXT NOT NULL,
            "patientType" TEXT NOT NULL,
            "consultationPurpose" TEXT NOT NULL,
            "jobPosition" TEXT NOT NULL,
            "jobDescription" TEXT NOT NULL,
            "occupationalRisks" TEXT NOT NULL,
            "riskDetails" TEXT NOT NULL,
            "personalHistory" TEXT NOT NULL,
            "familyHistory" TEXT NOT NULL,
            lifestyle TEXT NOT NULL,
            "mentalHealth" TEXT,
            "vitalSigns" TEXT NOT NULL,
            anthropometry TEXT NOT NULL,
            "physicalExamFindings" TEXT NOT NULL,
            diagnoses TEXT NOT NULL,
            "fitnessForWork" TEXT NOT NULL,
            "occupationalRecommendations" TEXT NOT NULL,
            "generalHealthPlan" TEXT NOT NULL,
            interconsultation TEXT,
            "nextFollowUp" TEXT,
            FOREIGN KEY ("personaId") REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY ("companyId") REFERENCES empresas(id) ON DELETE SET NULL
        );
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    // Create indexes for performance optimization
    console.log("Creating database indexes for performance...");

    // Personas table indexes - for faster searches
    await client.query(`CREATE INDEX IF NOT EXISTS idx_personas_cedula ON personas("cedulaNumero");`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_personas_nombres ON personas("primerNombre", "primerApellido");`);

    // Consultations table indexes - for faster reports and queries
    await client.query(`CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations("consultationDate");`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations("pacienteId");`);

    // Waitlist table indexes - for faster filtering and sorting
    await client.query(`CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_waitlist_checkin ON waitlist("checkInTime");`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_waitlist_patient ON waitlist("pacienteId");`);

    // Pacientes table index
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pacientes_persona ON pacientes("personaId");`);

    console.log("Database indexes created successfully.");
}


async function seedDb(client: PoolClient): Promise<void> {
    try {
        await client.query('BEGIN');

        const rolesToCreate = [
            { id: 'superuser', name: 'Superusuario', description: 'Acceso total a todas las funciones del sistema.', hasSpecialty: 1, permissions: ALL_PERMISSIONS.map(p => p.id) },
            { id: 'admin', name: 'Admin', description: 'Puede gestionar usuarios, roles y configuraciones.', hasSpecialty: 0, permissions: ['users.manage', 'roles.manage', 'settings.manage', 'companies.manage', 'specialties.manage', 'reports.view'] },
            { id: 'secretaria', name: 'Secretaria', description: 'Acceso a módulos de admisión y reportes básicos.', hasSpecialty: 0, permissions: ['waitlist.manage', 'people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'reports.view'] },
            { id: 'enfermera', name: 'Enfermera', description: 'Puede gestionar la bitácora de tratamiento y asistir en consultas.', hasSpecialty: 0, permissions: ['treatmentlog.manage', 'waitlist.manage'] },
            { id: 'dra_pediatra', name: 'Dra. Pediatra', description: 'Rol para médico pediatra.', hasSpecialty: 1, permissions: ['consultation.perform', 'hce.view', 'waitlist.manage', 'patientlist.view', 'treatmentlog.manage'] },
            { id: 'dra_familiar', name: 'Dra. Familiar', description: 'Rol para médico familiar.', hasSpecialty: 1, permissions: ['consultation.perform', 'hce.view', 'waitlist.manage', 'patientlist.view', 'treatmentlog.manage'] },
            { id: 'recepcionista', name: 'Recepcionista', description: 'Gestiona la sala de espera y el registro de pacientes.', hasSpecialty: 0, permissions: ['waitlist.manage', 'people.manage', 'titulars.manage', 'beneficiaries.manage'] },
        ];

        for (const role of rolesToCreate) {
            await client.query(
                'INSERT INTO roles (id, name, description, "hasSpecialty") VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [role.id, role.name, role.description, role.hasSpecialty]
            );
            for (const permissionId of role.permissions) {
                await client.query(
                    'INSERT INTO role_permissions ("roleId", "permissionId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [role.id, permissionId]
                );
            }
        }
        console.log("Roles seeded successfully.");

        const superuserResult = await client.query('SELECT id FROM users WHERE username = $1', ['superuser']);
        if (superuserResult.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await client.query(
                'INSERT INTO users (id, username, password, "roleId", name) VALUES ($1, $2, $3, $4, $5)',
                ['usr-super', 'superuser', hashedPassword, 'superuser', 'Super Administrador']
            );
            console.log("Superuser created.");
        }

        const assistantResult = await client.query('SELECT id FROM users WHERE username = $1', ['asistente']);
        if (assistantResult.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await client.query(
                'INSERT INTO users (id, username, password, "roleId", name) VALUES ($1, $2, $3, $4, $5)',
                ['usr-asist', 'asistente', hashedPassword, 'recepcionista', 'Asistente de Recepción']
            );
            console.log("Assistant user created.");
        }

        await client.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
            ['loginImage', '/la-viña/cpv-la viña.png.png']
        );
        await client.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
            ['loginOverlayImage', '/fondo-azul/fondo-azul,png.png']
        );

        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Failed to seed database:", error);
    }
}
