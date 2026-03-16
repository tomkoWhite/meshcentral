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

    obj.handleAdminReq = function (req, res, user) {
        res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
    };

    function installBotChatButton() {
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
                        e.preventDefault();
                        sessionStorage.setItem('botchatAutoOpen', '1');
                        window.location.href = '/?viewmode=43';
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

        if (!window.botchatTryAutoOpen) {
            window.botchatTryAutoOpen = function () {
                try {
                    if (sessionStorage.getItem('botchatAutoOpen') !== '1') return;
                    if (window.location.search.indexOf('viewmode=43') === -1) return;

                    const elements = Array.from(document.querySelectorAll('a, div, span, td'));
                    const target = elements.find(function (el) {
                        return (el.textContent || '').trim() === 'BotChat';
                    });

                    if (!target) {
                        setTimeout(window.botchatTryAutoOpen, 300);
                        return;
                    }

                    sessionStorage.removeItem('botchatAutoOpen');
                    target.click();
                } catch (e) {
                    console.error('BotChat auto-open error:', e);
                }
            };
        }

        setTimeout(function () {
            window.botchatAddButton();
            window.botchatTryAutoOpen();
        }, 300);
    }

    obj.onWebUIStartupEnd = function () {
        installBotChatButton();
    };

    obj.goPageEnd = function () {
        installBotChatButton();
    };

    return obj;
};
