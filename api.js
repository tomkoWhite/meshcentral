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

};
