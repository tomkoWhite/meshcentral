"use strict";

const path = require('path');
const db = require('./db');
const express = require('express');

module.exports.botchat = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.exports = ['onWebUIStartupEnd', 'goPageEnd'];
    obj.VIEWS = path.join(__dirname, 'views');

    obj.server_startup = function () {
        console.log('=== BOTCHAT server_startup ===');
    };

    obj.hook_setupHttpHandlers = function () {
        const app = obj.parent.webserver.app;

        app.use(express.json());

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

                res.json({ ok: true, items: items });
            } catch (e) {
                console.error('GET /botchat/notifications error:', e);
                res.status(500).json({ ok: false, error: 'db_read_failed' });
            }
        });

        app.post('/botchat/notify', function (req, res) {
            try {
                const body = req.body || {};

                if (!body.nodeId || !body.deviceName || !body.title || !body.message) {
                    return res.status(400).json({
                        ok: false,
                        error: 'missing_fields',
                        required: ['nodeId', 'deviceName', 'title', 'message']
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

                res.json({ ok: true, id: id });
            } catch (e) {
                console.error('POST /botchat/notify error:', e);
                res.status(500).json({ ok: false, error: 'db_write_failed' });
            }
        });

        app.get('/?viewmode=42', function (req, res) {
            res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
        });
    };

    obj.handleAdminReq = function (req, res, user) {
        res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
    };

    obj.onWebUIStartupEnd = function () {
        if (!window.botchatAddButton) {
            window.botchatAddButton = function () {
                try {
                    if (window.location.search.indexOf('nobotchat=1') >= 0) return;
                    if (document.getElementById('botchat-float-button')) return;

                    const btn = document.createElement('a');
                    btn.id = 'botchat-float-button';
                    btn.href = '#';
                    btn.title = 'BotChat';

                    btn.style.position = 'fixed';
                    btn.style.left = '8px';
                    btn.style.bottom = '230px';
                    btn.style.width = '74px';
                    btn.style.height = '74px';
                    btn.style.background = '#0b4a88';
                    btn.style.border = '2px solid rgba(255,255,255,0.18)';
                    btn.style.borderRadius = '8px';
                    btn.style.boxSizing = 'border-box';
                    btn.style.display = 'flex';
                    btn.style.flexDirection = 'column';
                    btn.style.alignItems = 'center';
                    btn.style.justifyContent = 'center';
                    btn.style.textDecoration = 'none';
                    btn.style.color = '#fff';
                    btn.style.zIndex = '99999';
                    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                    btn.style.fontFamily = 'Arial, sans-serif';

                    btn.innerHTML =
                        '<div style="font-size:26px; line-height:1;">💬</div>' +
                        '<div style="font-size:12px; margin-top:6px;">BotChat</div>';

                    btn.onclick = function (e) {
                        try {
                            if (typeof goPlugin === 'function') {
                                e.preventDefault();
                                return goPlugin('botchat', 'BotChat');
                            }
                        } catch (err) {
                            console.error('goPlugin error:', err);
                        }
                    };

                    btn.onmouseenter = function () {
                        btn.style.background = '#1260ad';
                    };

                    btn.onmouseleave = function () {
                        btn.style.background = '#0b4a88';
                    };

                    document.body.appendChild(btn);
                } catch (e) {
                    console.error('BotChat button error:', e);
                }
            };
        }

        setTimeout(function () {
            window.botchatAddButton();
        }, 300);
    };

    obj.goPageEnd = function () {
        if (!window.botchatAddButton) {
            window.botchatAddButton = function () {
                try {
                    if (document.getElementById('botchat-float-button')) return;

                    const btn = document.createElement('a');
                    btn.id = 'botchat-float-button';
                    btn.href = '#';
                    btn.title = 'BotChat';

                    btn.style.position = 'fixed';
                    btn.style.left = '8px';
                    btn.style.bottom = '-230px';
                    btn.style.width = '0px';
                    btn.style.height = '0px';
                    btn.style.background = '#0b4a88';
                    btn.style.border = '2px solid rgba(255,0,0,0.18)';
                    btn.style.borderRadius = '8px';
                    btn.style.boxSizing = 'border-box';
                    btn.style.display = 'flex';
                    btn.style.flexDirection = 'column';
                    btn.style.alignItems = 'center';
                    btn.style.justifyContent = 'center';
                    btn.style.textDecoration = 'none';
                    btn.style.color = '#fff';
                    btn.style.zIndex = '99999';
                    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                    btn.style.fontFamily = 'Arial, sans-serif';

                    btn.innerHTML =
                        '<div style="font-size:26px; line-height:1;">💬</div>' +
                        '<div style="font-size:12px; margin-top:6px;">BotChat</div>';

                    btn.onclick = function (e) {
                        try {
                            if (typeof goPlugin === 'function') {
                                e.preventDefault();
                                return goPlugin('botchat', 'BotChat');
                            }
                        } catch (err) {
                            console.error('goPlugin error:', err);
                        }
                    };

                    btn.onmouseenter = function () {
                        btn.style.background = '#1260ad';
                    };

                    btn.onmouseleave = function () {
                        btn.style.background = '#0b4a88';
                    };

                    document.body.appendChild(btn);
                } catch (e) {
                    console.error('BotChat button error:', e);
                }
            };
        }

        setTimeout(function () {
            window.botchatAddButton();
        }, 300);
    };

    return obj;
};
