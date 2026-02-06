
import dotenv from 'dotenv';
import path from 'path';

// Force load ONLY the .env file to see what node receives
const result = dotenv.config({ path: path.join(process.cwd(), '.env') });

if (result.error) {
    console.error("Error loading .env file:", result.error);
} else {
    console.log("--- PARSED .ENV CONTENT ---");
    const url = process.env.POSTGRES_URL || '';
    console.log(`Raw POSTGRES_URL length: ${url.length}`);

    // Show first and last few chars to verify without revealing full password in logs unnecessarily
    // format: postgresql://postgres:j-*75*55861@localhost:5432/medihub
    if (url.includes('@')) {
        const parts = url.split('@');
        const credentials = parts[0].split('//')[1];
        if (credentials && credentials.includes(':')) {
            const password = credentials.split(':')[1];
            console.log(`Parsed Password: '${password}'`);
            console.log(`Password Length: ${password.length}`);
            console.log(`Password Character Codes: ${password.split('').map(c => c.charCodeAt(0)).join(', ')}`);
        }
    } else {
        console.log("URL format incorrect or not found.");
    }
}
