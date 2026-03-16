"use strict";

const path = require('path');

module.exports.botchat = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.exports = [];
    obj.VIEWS = path.join(__dirname, 'views');

    obj.server_startup = function () {
        console.log('=== BOTCHAT server_startup ===');
    };

    obj.handleAdminReq = function (req, res, user) {
        res.sendFile(path.join(obj.VIEWS, 'botchat.html'));
    };

    return obj;
};
