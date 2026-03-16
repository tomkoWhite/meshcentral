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

    obj.hook_setupHttpHandlers = function () {
        const app = obj.parent.webserver.app;

        app.get('/?viewmode=42', function (req, res) {
            res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
        });
    };

    obj.handleAdminReq = function (req, res, user) {
        res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
    };

    function createButton() {
        // Nepřidávej tlačítko na desktop view
        try {
            if (window.location.search.indexOf('viewmode=11') >= 0) {
                document.querySelectorAll('#botchat-float-button').forEach(function (el) {
                    el.remove();
                });
                return;
            }
        } catch (e) { }

        // Smaž případné duplikáty
        document.querySelectorAll('#botchat-float-button').forEach(function (el) {
            el.remove();
        });

        const btn = document.createElement('a');
        btn.id = 'botchat-float-button';
        btn.href = '/?viewmode=42';
        btn.title = 'BotChat';

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
        btn.style.cursor = 'pointer';

        btn.innerHTML =
            '<div style="font-size:26px; line-height:1;">💬</div>' +
            '<div style="font-size:12px; margin-top:6px;">BotChat</div>';

        btn.onmouseenter = function () {
            btn.style.background = '#1260ad';
        };

        btn.onmouseleave = function () {
            btn.style.background = '#0b4a88';
        };

        document.body.appendChild(btn);
    }

    obj.onWebUIStartupEnd = function () {
        if (!window.botchatAddButton) {
            window.botchatAddButton = createButton;
        }

        setTimeout(function () {
            window.botchatAddButton();
        }, 300);
    };

    obj.goPageEnd = function () {
        if (!window.botchatAddButton) {
            window.botchatAddButton = createButton;
        }

        setTimeout(function () {
            window.botchatAddButton();
        }, 300);
    };

    return obj;
};
