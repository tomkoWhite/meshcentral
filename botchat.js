"use strict";

const path = require('path');

module.exports.botchat = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.exports = ['onWebUIStartupEnd', 'goPageEnd'];
    obj.VIEWS = path.join(__dirname, 'views');

    obj.server_startup = function () {
        console.log('=== BOTCHAT server_startup ===');
    };

    // Přímá stránka BotChat
    obj.hook_setupHttpHandlers = function () {
        const app = obj.parent.webserver.app;

        app.get('/plugins/botchat', function (req, res) {
            res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
        });
    };

    // Stávající plugin admin page
    obj.handleAdminReq = function (req, res, user) {
        res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
    };

    // Web UI hook po prvním načtení
    obj.onWebUIStartupEnd = function () {
        try { window.botchatAddSidebarButton(); } catch (e) { console.error(e); }
    };

    // Web UI hook po změně stránky
    obj.goPageEnd = function () {
        try { window.botchatAddSidebarButton(); } catch (e) { console.error(e); }
    };

    return obj;
};
