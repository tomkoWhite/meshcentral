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

db.exec(`
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    start_at INTEGER NOT NULL,
    end_at INTEGER NOT NULL,
    start_triggered INTEGER NOT NULL DEFAULT 0,
    end_triggered INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
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

function addSchedule(data) {
    const stmt = db.prepare(`
        INSERT INTO schedules (
            node_id, device_name, start_at, end_at, start_triggered, end_triggered, created_at
        ) VALUES (?, ?, ?, ?, 0, 0, ?)
    `);

    const info = stmt.run(
        data.nodeId,
        data.deviceName,
        data.startAt,
        data.endAt,
        Date.now()
    );

    return info.lastInsertRowid;
}

function getSchedules() {
    return db.prepare(`
        SELECT id, node_id, device_name, start_at, end_at, start_triggered, end_triggered, created_at
        FROM schedules
        ORDER BY start_at ASC
    `).all();
}

function deleteSchedule(id) {
    const stmt = db.prepare(`
        DELETE FROM schedules
        WHERE id = ?
    `);

    const info = stmt.run(id);
    return info.changes > 0;
}

function getDueStartSchedules(now) {
    return db.prepare(`
        SELECT id, node_id, device_name, start_at, end_at, start_triggered, end_triggered, created_at
        FROM schedules
        WHERE start_triggered = 0 AND start_at <= ?
        ORDER BY start_at ASC
    `).all(now);
}

function getDueEndSchedules(now) {
    return db.prepare(`
        SELECT id, node_id, device_name, start_at, end_at, start_triggered, end_triggered, created_at
        FROM schedules
        WHERE end_triggered = 0 AND end_at <= ?
        ORDER BY end_at ASC
    `).all(now);
}

function markScheduleStartTriggered(id) {
    const stmt = db.prepare(`
        UPDATE schedules
        SET start_triggered = 1
        WHERE id = ?
    `);
    stmt.run(id);
}

function markScheduleEndTriggered(id) {
    const stmt = db.prepare(`
        UPDATE schedules
        SET end_triggered = 1
        WHERE id = ?
    `);
    stmt.run(id);
}

module.exports = {
    addNotification,
    getActiveNotifications,
    addSchedule,
    getSchedules,
    deleteSchedule,
    getDueStartSchedules,
    getDueEndSchedules,
    markScheduleStartTriggered,
    markScheduleEndTriggered
};
