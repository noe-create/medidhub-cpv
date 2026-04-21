const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'people-list.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("from '@/lib/utils'")) {
    const importLine = "import { calculateAge } from '@/lib/utils';\n";
    // Insert after 'use client';
    content = content.replace(/'use client';/, "'use client';\n\n" + importLine);
    fs.writeFileSync(filePath, content);
    console.log('Import injected successfully.');
} else {
    console.log('Import already exists (or similar found).');
}
