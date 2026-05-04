SELECT id, name, "specialtyId" FROM "Doctor" WHERE "userId" IN (SELECT id FROM users WHERE username = 'aherrera');
