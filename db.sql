--
-- File generated with SQLiteStudio v3.4.4 on Вс сен 10 01:30:48 2023
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: bot_stats
CREATE TABLE IF NOT EXISTS bot_stats (videos_processed INTEGER);

-- Table: channels
CREATE TABLE IF NOT EXISTS channels (channel_id TEXT, autoconversion INTEGER DEFAULT (0));

-- Table: processes
CREATE TABLE IF NOT EXISTS processes (filename TEXT, time TEXT, date TEXT);

-- Table: servers
CREATE TABLE IF NOT EXISTS servers (server_id TEXT, lang TEXT DEFAULT en);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
