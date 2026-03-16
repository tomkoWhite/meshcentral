"use strict";

const path = require('path');
const fs = require('fs');
const Database = require('/usr/local/lib/node_modules/meshcentral/node_modules/better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'botchat.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
)
`);

function addNotification(data) {
    const stmt = db.prepare(`
        INSERT INTO notifications (
            node_id, device_name, title, message, created_at, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    const info = stmt.run(
        data.nodeId,
        data.deviceName,
        data.title,
        data.message,
        data.createdAt,
        data.expiresAt
    );

    return info.lastInsertRowid;
}

function getActiveNotifications() {
    return db.prepare(`
        SELECT id, node_id, device_name, title, message, created_at, expires_at, status
        FROM notifications
        WHERE status = 'active'
        ORDER BY created_at DESC
    `).all();
}

module.exports = {
    addNotification,
    getActiveNotifications
};
