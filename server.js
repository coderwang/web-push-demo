const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./server/routes');

const app = express();
const PORT = 3009;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);

app.listen(PORT, () => {
  console.log(`\n🚀 Web Push Demo 已启动: http://localhost:${PORT}\n`);
});
