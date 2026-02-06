import { createCompany, createJobPosition, createOccupationalEvaluation, getOccupationalEvaluationsByPerson } from '../actions/occupational-actions';
import { suggestMedicalExams } from '../ai/flows/occupational';
import { getDb } from '../lib/db';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}


async function main() {
    console.log("Starting Occupational Health Module Test...");

    // 1. Test Database Connection
    console.log("\n1. Testing Database Connection...");
    try {
        const db = await getDb();
        console.log("Database connected successfully.");
    } catch (error) {
        console.error("Database connection failed:", error);
        return;
    }

    // 2. Test Create Company
    console.log("\n2. Testing Create Company...");
    const companyRes = await createCompany({
        name: "Test Company " + Date.now(),
        rif: "J-123456789",
        telefono: "555-0000",
        direccion: "Test Address"
    });
    console.log("Create Company Result:", companyRes);

    // 3. Test Create Job Position
    console.log("\n3. Testing Create Job Position...");
    const jobRes = await createJobPosition({
        name: "Test Job " + Date.now(),
        description: "A dangerous job",
        riskLevel: "Alto",
        risks: ["Altura", "Ruido", "Polvo"]
    });
    console.log("Create Job Position Result:", jobRes);

    // 4. Test AI Flow (Suggest Exams)
    console.log("\n4. Testing AI Flow (Suggest Exams)...");
    try {
        const aiRes = await suggestMedicalExams({
            jobTitle: "Obrero de Construcción",
            jobDescription: "Trabajo en alturas, manejo de cargas pesadas, exposición a polvo y ruido."
        });
        console.log("AI Suggestion Result:", JSON.stringify(aiRes, null, 2));
    } catch (error) {
        console.error("AI Flow failed:", error);
    }

    console.log("\nTest Completed.");
}

main().catch(console.error);
