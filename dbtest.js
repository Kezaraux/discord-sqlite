const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const db = new sqlite3.Database("./testdb.db", err => {
    if (err) {
        console.error(err);
        return;
    }

    console.log("Connected to the database!");
});

const schemaSql = fs.readFileSync("./db/schema.sql").toString();
const queries = schemaSql.split(";");

db.serialize(() => {
    queries.forEach(query => {
        if (query) {
            query += ";";
            db.run(query, err => {
                if (err) throw err;
            });
        }
    });
});

db.close();
