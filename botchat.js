"use strict";

const path = require('path');
//const registerApi = require('./api');

module.exports.botchat = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.exports = ['onWebUIStartupEnd', 'goPageEnd'];
    obj.VIEWS = path.join(__dirname, 'views');

    obj.server_startup = function () {
        console.log('=== BOTCHAT server_startup ===');
    };

    obj.hook_setupHttpHandlers = function (args) {

        const app =
            (args && typeof args.get === 'function') ? args :
            (args && args.app && typeof args.app.get === 'function') ? args.app :
            (obj.parent && obj.parent.webserver && obj.parent.webserver.app && typeof obj.parent.webserver.app.get === 'function') ? obj.parent.webserver.app :
            null;
    
        if (!app) {
            console.error('BOTCHAT: Express app not found in hook_setupHttpHandlers');
            return;
        }
    
        app.get('/botchat/test', function (req, res) {
            res.json({ ok: true, test: 'botchat route works' });
        });
    
        app.get('/botchat/notifications', function (req, res) {
            try {
                const items = require('./db').getActiveNotifications().map(function (n) {
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
    
        app.get('/botchat/addtest', function (req, res) {
            try {
                const db = require('./db');
                const now = Date.now();
    
                const id = db.addNotification({
                    nodeId: 'csVl9zfywTPBJsG5B9L297VAhmnCcYxUdUHF31Esi@cLyXUU4ksEkt1T0sx1ozL7',
                    deviceName: 'RPi1',
                    title: 'Test notifikace',
                    message: 'Tohle je testovací notifikace z BotChat pluginu.',
                    createdAt: now,
                    expiresAt: now + (5 * 60 * 1000)
                });
    
                res.json({
                    ok: true,
                    id: id
                });
            } catch (e) {
                console.error('BOTCHAT ADDTEST ERROR:', e);
                res.status(500).json({
                    ok: false,
                    error: 'addtest_failed'
                });
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
