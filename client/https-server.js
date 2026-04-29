import fs from 'fs';
import https from 'https';
import express from 'express';
import path from 'path';

const app = express();
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*splat', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

const PORT = process.env.APP_PORT || 443;
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
});