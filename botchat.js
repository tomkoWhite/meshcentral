"use strict";

const path = require('path');
const BOTCHAT_API_KEY = 'NZQGkV2di7NzeB8V6FX98PJENvZkClkpAnP5JuUo5rgcMWudmXmddcUqvD9pU9ei';

module.exports.botchat = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.exports = ['onWebUIStartupEnd', 'goPageEnd'];
    obj.VIEWS = path.join(__dirname, 'views');

    obj.server_startup = function () {
        console.log('=== BOTCHAT server_startup ===');
    };

    function getMeshCentralDevices(obj, callback) {
        try {
            const db = obj?.meshServer?.db;
            if (!db || typeof db.GetAllType !== 'function') {
                console.error('BOTCHAT devices: db.GetAllType not available');
                return callback([]);
            }

            db.GetAllType('node', function (err, docs) {
                if (err) {
                    console.error('BOTCHAT db.GetAllType(node) error:', err);
                    return callback([]);
                }

                if (!Array.isArray(docs)) {
                    console.error('BOTCHAT db.GetAllType(node): result is not array');
                    return callback([]);
                }

                const devices = docs.map(function (n) {
                    return {
                        nodeId: n._id || n.id || '',
                        deviceName: n.name || n.rname || n.host || '(bez názvu)',
                        meshId: n.meshid || n.meshId || null
                    };
                }).filter(function (d) {
                    return d.nodeId;
                }).sort(function (a, b) {
                    return (a.deviceName || '').localeCompare(b.deviceName || '');
                });

                callback(devices);
            });
        } catch (ex) {
            console.error('BOTCHAT getMeshCentralDevices exception:', ex);
            callback([]);
        }
    }

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

        // app.use(obj.parent.express.json());

        app.get('/botchat/test', function (req, res) {
            res.json({ ok: true, test: 'botchat route works' });
        });

        // === DEVICES ===
        app.get('/botchat/devices', function (req, res) {
            try {
                getMeshCentralDevices(obj, function (devices) {
                    res.json({
                        ok: true,
                        items: devices
                    });
                });
            } catch (ex) {
                console.error('DEVICES ERROR:', ex);
                res.status(500).json({
                    ok: false,
                    error: 'devices_failed',
                    details: String(ex)
                });
            }
        });

        app.get('/botchat/devices/debug', function (req, res) {
            try {
                const db = obj?.meshServer?.db;

                res.json({
                    ok: true,
                    hasMeshServer: !!obj.meshServer,
                    hasDb: !!db,
                    hasGetAllType: !!db?.GetAllType,
                    hasGetAllTypeNoTypeFieldMeshFiltered: !!db?.GetAllTypeNoTypeFieldMeshFiltered,
                    hasGetAllTypeNodeFiltered: !!db?.GetAllTypeNodeFiltered,
                    hasReqUser: !!req.user,
                    hasReqDomain: !!req.domain
                });
            } catch (ex) {
                res.status(500).json({
                    ok: false,
                    error: 'debug_failed',
                    details: String(ex)
                });
            }
        });

        app.get('/botchat/inspect', function (req, res) {
            try {
                function safeKeys(x) {
                    if (!x || typeof x !== 'object') return [];
                    try { return Object.keys(x).slice(0, 200); } catch (e) { return ['<unreadable>']; }
                }

                res.json({
                    ok: true,
                    parentKeys: safeKeys(obj.parent),
                    meshServerKeys: safeKeys(obj.meshServer),
                    parentParentKeys: safeKeys(obj.parent?.parent),
                    parentDbKeys: safeKeys(obj.parent?.db),
                    meshServerDbKeys: safeKeys(obj.meshServer?.db),
                    parentWebserverKeys: safeKeys(obj.parent?.webserver),
                    meshServerWebserverKeys: safeKeys(obj.meshServer?.webserver)
                });
            } catch (ex) {
                res.status(500).json({
                    ok: false,
                    error: 'inspect_failed',
                    details: String(ex)
                });
            }
        });

        app.get('/botchat/sessiondebug', function (req, res) {
            try {
                function safeKeys(x) {
                    if (!x || typeof x !== 'object') return [];
                    try { return Object.keys(x).slice(0, 80); } catch (e) { return ['<unreadable>']; }
                }

                res.json({
                    ok: true,
                    hasSession: !!req.session,
                    sessionKeys: safeKeys(req.session),
                    sessionUserId: req.session ? (req.session.userid || req.session.userId || null) : null,
                    sessionDomainId: req.session ? (req.session.domainid || req.session.domainId || null) : null,
                    hasCookies: !!req.headers.cookie,
                    reqKeys: safeKeys(req),
                    webserverHasUsers: !!obj?.meshServer?.webserver?.users,
                    webserverUserCount: obj?.meshServer?.webserver?.users ? Object.keys(obj.meshServer.webserver.users).length : 0
                });
            } catch (ex) {
                res.status(500).json({
                    ok: false,
                    error: 'sessiondebug_failed',
                    details: String(ex)
                });
            }
        });

        // === NOTIFICATIONS ===
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

        app.post('/botchat/notify', function (req, res) {
            try {
                let body = (req.body && Object.keys(req.body).length) ? req.body : req.query;

                const key =
                    req.headers['x-api-key'] ||
                    req.query.key ||
                    (body ? body.key : null);

                if (key !== BOTCHAT_API_KEY) {
                    return res.status(403).json({
                        ok: false,
                        error: 'unauthorized'
                    });
                }

                if (!body || typeof body !== 'object' || !Object.keys(body).length) {
                    return res.status(400).json({
                        ok: false,
                        error: 'invalid_json'
                    });
                }

                if (!body.nodeId || !body.deviceName || !body.title || !body.message) {
                    return res.status(400).json({
                        ok: false,
                        error: 'missing_fields',
                        required: ['nodeId', 'deviceName', 'title', 'message']
                    });
                }

                const now = Date.now();
                const durationSeconds = Number(body.duration || body.ttlSeconds || 300);

                const id = require('./db').addNotification({
                    nodeId: body.nodeId,
                    deviceName: body.deviceName,
                    title: body.title,
                    message: body.message,
                    createdAt: now,
                    expiresAt: now + (durationSeconds * 1000)
                });

                res.json({
                    ok: true,
                    id: id
                });
            } catch (e) {
                console.error('BOTCHAT NOTIFY ERROR:', e);
                res.status(500).json({
                    ok: false,
                    error: 'notify_failed'
                });
            }
        });

        // === SCHEDULES ===
        app.get('/botchat/schedules', function (req, res) {
            try {
                const items = require('./db').getSchedules().map(function (s) {
                    return {
                        id: s.id,
                        nodeId: s.node_id,
                        deviceName: s.device_name,
                        startAt: s.start_at,
                        endAt: s.end_at,
                        startTriggered: s.start_triggered,
                        endTriggered: s.end_triggered,
                        createdAt: s.created_at
                    };
                });
        
                res.json({
                    ok: true,
                    items: items
                });
            } catch (e) {
                console.error('SCHEDULE GET ERROR:', e);
                res.status(500).json({
                    ok: false,
                    error: 'schedule_get_failed'
                });
            }
        });

        app.post('/botchat/schedules',
            obj.meshServer.webserver.bodyParser.json(),
            function (req, res) {
            try {
                let body = (req.body && Object.keys(req.body).length) ? req.body : req.query;
        
                if (!body || typeof body !== 'object' || !Object.keys(body).length) {
                    return res.status(400).json({
                        ok: false,
                        error: 'invalid_json'
                    });
                }
        
                if (!body.nodeId || !body.deviceName || !body.startAt || !body.endAt) {
                    return res.status(400).json({
                        ok: false,
                        error: 'missing_fields',
                        required: ['nodeId', 'deviceName', 'startAt', 'endAt']
                    });
                }
        
                const startAt = Number(body.startAt);
                const endAt = Number(body.endAt);
        
                if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
                    return res.status(400).json({
                        ok: false,
                        error: 'invalid_time'
                    });
                }
        
                if (endAt <= startAt) {
                    return res.status(400).json({
                        ok: false,
                        error: 'invalid_range'
                    });
                }
        
                const id = require('./db').addSchedule({
                    nodeId: body.nodeId,
                    deviceName: body.deviceName,
                    startAt: startAt,
                    endAt: endAt
                });
        
                res.json({
                    ok: true,
                    id: id
                });
            } catch (e) {
                console.error('SCHEDULE ADD ERROR:', e);
                res.status(500).json({
                    ok: false,
                    error: 'schedule_add_failed'
                });
            }
        });

        app.delete('/botchat/schedules/:id', function (req, res) {
            try {
                const id = Number(req.params.id);
        
                if (!Number.isInteger(id) || id <= 0) {
                    return res.status(400).json({
                        ok: false,
                        error: 'invalid_id'
                    });
                }
        
                const deleted = require('./db').deleteSchedule(id);
        
                if (!deleted) {
                    return res.status(404).json({
                        ok: false,
                        error: 'not_found'
                    });
                }
        
                res.json({
                    ok: true,
                    deleted: true
                });
            } catch (e) {
                console.error('SCHEDULE DELETE ERROR:', e);
                res.status(500).json({
                    ok: false,
                    error: 'schedule_delete_failed'
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
