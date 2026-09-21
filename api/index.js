// Adaptador Vercel Functions: reutiliza la app Express.
// src/index.js solo hace listen cuando es entrypoint (require.main), asi que
// requerirlo aqui es seguro. Local sigue igual: node src/index.js
module.exports = require('../src/index.js');
