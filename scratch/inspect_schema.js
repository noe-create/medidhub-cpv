const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('medihub.db');

db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    rows.forEach(row => {
        console.log(`Table: ${row.name}`);
        console.log(row.sql);
        console.log('---');
    });
    db.close();
});
