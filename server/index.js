const path = require('path');
const express = require('express');
const {PORT} = require('../config.server.json');

const test = require('./cloudfunction/test/').main

const app = express();

// 添加云函数mock
app.get('/api/test', (req, res) => {
    // 将 req.query 传入
    test(req.query)
        .then(res.json.bind(res))
        .catch((err) => {
            console.log(err);
        });
});

// 添加static
app.use(
    './static',
    express.static(path.join(__dirname, 'static'), {
        index: false,
        maxAge: '30d'
    })
);

app.listen(PORT, () => {
    console.log(`开发服务器启动成功：http://127.0.0.1:${PORT}`)
});