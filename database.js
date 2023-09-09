import sqlite3 from 'sqlite3';
import * as log from "./logger.js";
import * as utils from "./utils.js";
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

export function addServer(serverid) {
    return new Promise((resolve) => {
        db.serialize(async () => {
            db.get(`SELECT * FROM servers WHERE server_id = ?`, serverid, (err, row) => {
                if (row === undefined) { 
                    db.run("INSERT INTO servers(server_id) VALUES (?)", serverid);
                    log.info(`Added new server ${serverid}`);
                    
                };
                resolve();
            })
        });
    })
};

export function addChannel(channelid) {
    return new Promise((resolve) => {
        db.serialize(async () => {
            db.get(`SELECT * FROM channels WHERE channel_id = ?`, channelid, (err, row) => {
                if (row === undefined) { 
                    db.run("INSERT INTO channels(channel_id) VALUES (?)", channelid);
                    log.info(`Added new channel ${channelid}`);
                };
                resolve();
            })
        });
    })
};

export function setLanguage(serverid, lang) {
    db.serialize(() => {
        db.run(`UPDATE servers SET lang = "${lang}" WHERE server_id = "${serverid}"`, (err, row) => { });
    });
};

export function setAutoconversion(channelid, value) {
    db.serialize(() => {
        const v = value ? 1 : 0;
        db.run(`UPDATE channels SET autoconversion = "${v}" WHERE channel_id = "${channelid}"`, (err, row) => { });
    });
};

export async function getLang(serverid) {
    return new Promise((resolve) => {
        db.serialize(() => {
            db.get(`SELECT lang FROM servers WHERE server_id = "${serverid}"`, (err, row) => {
                resolve(utils.getLang(row.lang));
            });
        });
    })
};

export async function isAutoconversionEnabled(channelid) {
    return new Promise((resolve) => {
        db.serialize(() => {
            db.get(`SELECT autoconversion FROM channels WHERE channel_id = "${channelid}"`, (err, row) => {
                resolve(!!+row.autoconversion);
            });
        })
    })
}