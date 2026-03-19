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

db.exec(`
CREATE TABLE IF NOT EXISTS event_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    schedule_id INTEGER,
    notification_id INTEGER,
    node_id TEXT,
    device_name TEXT,
    created_at INTEGER NOT NULL,
    resolved_at INTEGER,
    duration_seconds INTEGER,
    resolution_type TEXT,
    note TEXT
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

function getNotificationById(id) {
    return db.prepare(`
        SELECT id, node_id, device_name, title, message, created_at, expires_at, status
        FROM notifications
        WHERE id = ?
    `).get(id);
}

function getActiveNotifications() {
    return db.prepare(`
        SELECT id, node_id, device_name, title, message, created_at, expires_at, status
        FROM notifications
        WHERE status = 'active'
        ORDER BY created_at DESC
    `).all();
}

function deleteNotification(id) {
    const stmt = db.prepare(`
        DELETE FROM notifications
        WHERE id = ?
    `);

    const info = stmt.run(id);
    return info.changes > 0;
}

function markNotificationExpired(id) {
    const stmt = db.prepare(`
        UPDATE notifications
        SET status = 'expired'
        WHERE id = ?
    `);

    const info = stmt.run(id);
    return info.changes > 0;
}

function getExpiredActiveNotifications(now) {
    return db.prepare(`
        SELECT id, node_id, device_name, title, message, created_at, expires_at, status
        FROM notifications
        WHERE status = 'active' AND expires_at <= ?
        ORDER BY expires_at ASC
    `).all(now);
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

function addEventLog(data) {
    const stmt = db.prepare(`
        INSERT INTO event_logs (
            event_type,
            schedule_id,
            notification_id,
            node_id,
            device_name,
            created_at,
            resolved_at,
            duration_seconds,
            resolution_type,
            note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
        data.eventType,
        data.scheduleId || null,
        data.notificationId || null,
        data.nodeId || null,
        data.deviceName || null,
        data.createdAt,
        data.resolvedAt || null,
        Number.isFinite(data.durationSeconds) ? data.durationSeconds : null,
        data.resolutionType || null,
        data.note || null
    );

    return info.lastInsertRowid;
}

function getEventLogs(limit) {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    return db.prepare(`
        SELECT
            id,
            event_type,
            schedule_id,
            notification_id,
            node_id,
            device_name,
            created_at,
            resolved_at,
            duration_seconds,
            resolution_type,
            note
        FROM event_logs
        ORDER BY created_at DESC, id DESC
        LIMIT ?
    `).all(safeLimit);
}

function resolveNotificationEvent(notificationId, resolutionType, resolvedAt) {
    const logRow = db.prepare(`
        SELECT id, created_at
        FROM event_logs
        WHERE event_type = 'notification_created'
          AND notification_id = ?
          AND resolved_at IS NULL
        ORDER BY id DESC
        LIMIT 1
    `).get(notificationId);

    if (!logRow) return false;

    const durationSeconds = Math.max(0, Math.floor((resolvedAt - logRow.created_at) / 1000));

    const info = db.prepare(`
        UPDATE event_logs
        SET resolved_at = ?,
            duration_seconds = ?,
            resolution_type = ?
        WHERE id = ?
    `).run(resolvedAt, durationSeconds, resolutionType, logRow.id);

    return info.changes > 0;
}

module.exports = {
    addNotification,
    getNotificationById,
    getActiveNotifications,
    deleteNotification,
    markNotificationExpired,
    getExpiredActiveNotifications,

    addSchedule,
    getSchedules,
    deleteSchedule,
    getDueStartSchedules,
    getDueEndSchedules,
    markScheduleStartTriggered,
    markScheduleEndTriggered,

    addEventLog,
    getEventLogs,
    resolveNotificationEvent
};
