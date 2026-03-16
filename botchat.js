"use strict";

module.exports.botchat = function (parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.exports = [];
    obj.VIEWS = __dirname + '/views/';

    obj.server_startup = function () {
        console.log('=== BOTCHAT server_startup ===');
    };

    obj.handleAdminReq = function (req, res, user) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <title>BotChat</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; }
    </style>
</head>
<body>
    <h1>BotChat</h1>
    <p>Tady budou notifikace.</p>
</body>
</html>`);
    };

    return obj;
};
