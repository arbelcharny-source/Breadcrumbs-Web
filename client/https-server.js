import fs from 'fs';
import https from 'https';
import express from 'express';
import path from 'path';

const app = express();
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*splat', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

const options = {
    key: fs.readFileSync('/home/node20/app/Breadcrumbs-Web/client-key.pem'),
    cert: fs.readFileSync('/home/node20/app/Breadcrumbs-Web/client-cert.pem')
};

https.createServer(options, app).listen(443, () => {
    console.log('HTTPS Server running on port 443');
});