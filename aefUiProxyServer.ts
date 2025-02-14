// Import the express in typescript file
import express from 'express';
import path from 'path';
import { Proxy } from 'axios-express-proxy';
import https from 'https';
import fs from 'fs';

// Initialize the express engine
const app: express.Application = express();

// Load your SSL certificate and private key
const privateKey = fs.readFileSync('localhost-key.pem', 'utf8');
const certificate = fs.readFileSync('localhost.pem', 'utf8');

const passphrase = ''; // Replace with your passphrase
const credentials = { key: privateKey, passphrase, cert: certificate };

//suppress self signed cert validation till we get CA cert, but still use https
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create an HTTPS server with your Express app
const httpsServer = https.createServer(credentials, app);

// Take a port 3000 for running server.
const port: number = 3300;

// Define a middleware to redirect HTTP to HTTPS
const ensureSecure = (req: any, res: any, next: any) => {
    if (req.secure) {
        // Request is already secure (HTTPS)
        return next();
    }
    // Redirect to HTTPS version of the URL
    res.redirect('https://' + req.hostname + req.originalUrl);
}

// Use the middleware to enforce HTTPS
app.use(express.json());
app.use(ensureSecure);

// app.use('/aefui', express.static(path.join(__dirname, 'aefui')));
app.use('/images', express.static(path.join(__dirname, 'aefui/images')));
app.use('/static', express.static(path.join(__dirname, 'aefui/static')));

// Handling '/' Request
app.get('/', (_req, _res) => {
    _res.sendFile(path.join(__dirname, '/aefui/index.html'));
});

//TODO: what about separte functions for POST, GET, DELETE, PUT
app.all('/api/v1/*', (_req, _res) => {
    try {
        console.log('Original URL ::' + _req.originalUrl);
        Proxy('https://3.0.229.130'+_req.originalUrl, _req, _res);
    }
    catch(error) {
        console.log("Error in api server call :(");
    }
});

// Start the HTTPS server
httpsServer.listen(port, () => {
    console.log('server up!!');
});