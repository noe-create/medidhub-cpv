
import { getDb } from './src/lib/db';

async function finalNuke() {
    console.log("Starting FINAL NUMERIC RESET (Dropping all tables to change types to INTEGER)...");
    const db = await getDb();
    
    try {
        await db.exec('BEGIN');
        
        const tables = [
            'survey_responses', 'survey_invitations', 'survey_questions', 'surveys',
            'treatment_executions', 'treatment_order_items', 'treatment_orders',
            'lab_order_items', 'lab_orders',
            'consultation_documents', 'consultation_diagnoses', 'consultations',
            'waitlist', 'beneficiarios', 'titulares', 'pacientes', 'job_positions',
            'occupational_incidents', 'occupational_health_evaluations',
            'invoice_items', 'invoices', 'services', 'empresas', 'personas',
            'roles', 'role_permissions', 'specialties', 'users', 'settings', 'sequences'
        ];

        for (const table of tables) {
            try {
                await db.exec(`DROP TABLE IF EXISTS "${table}" CASCADE`);
                console.log(`Dropped table: ${table}`);
            } catch (e) {
                console.warn(`Could not drop table ${table}:`, e.message);
            }
        }
        
        await db.exec('COMMIT');
        console.log("Numeric Reset COMPLETE. New schema will be applied on next app access.");
    } catch (e) {
        await db.exec('ROLLBACK');
        console.error("Numeric Nuke failed:", e);
    }
}

finalNuke();
