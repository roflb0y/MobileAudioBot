import sqlite3 from 'sqlite3';
const db = new sqlite3.Database("./database.db");

export function getProcessCount() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get("SELECT * FROM bot_stats", (err, row) => {
                resolve(row["videos_processed"]);
            });
        });
    })
};

export function updateVideosProcessed() {
    db.serialize(() => {
        db.get("SELECT * FROM bot_stats", (err, row) => {
            let count = row["videos_processed"]
            count++;
            db.run("UPDATE bot_stats SET videos_processed = ?", count)
        });
    });
};

export function insertProcessIdkLmaooo(fileid, time) {
    db.serialize(() => {
        db.run("INSERT INTO processes VALUES (?, ?, ?)", "dev terms momento", time.toString(), new Date().toString())
    });
};
