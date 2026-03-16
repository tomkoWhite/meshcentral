"use strict";

const db = require('./db');

module.exports = function registerApi(app) {

    app.get('/botchat/notifications', function (req, res) {
        try {
            const items = db.getActiveNotifications().map(function (n) {
                return {
                    id: n.id,
                    nodeId: n.node_id,
                    deviceName: n.device_name,
                    title: n.title,
                    message: n.message,
                    createdAt: n.created_at,
                    expiresAt: n.expires_at,
                    status: n.status
                };
            });

            res.json({
                ok: true,
                items: items
            });
        } catch (e) {
            console.error('BOTCHAT DB READ ERROR:', e);
            res.status(500).json({
                ok: false,
                error: 'db_read_failed'
            });
        }
    });

    app.post('/botchat/notify', function (req, res) {
        try {
            const body = req.body || {};

            if (!body.nodeId || !body.deviceName || !body.title || !body.message) {
                return res.status(400).json({
                    ok: false,
                    error: 'missing_fields'
                });
            }

            const createdAt = Date.now();
            const expiresAt = body.expiresAt
                ? Number(body.expiresAt)
                : createdAt + ((Number(body.ttlSeconds) || 300) * 1000);

            const id = db.addNotification({
                nodeId: body.nodeId,
                deviceName: body.deviceName,
                title: body.title,
                message: body.message,
                createdAt: createdAt,
                expiresAt: expiresAt
            });

            res.json({
                ok: true,
                id: id
            });
        } catch (e) {
            console.error('BOTCHAT DB WRITE ERROR:', e);
            res.status(500).json({
                ok: false,
                error: 'db_write_failed'
            });
        }
    });
};
