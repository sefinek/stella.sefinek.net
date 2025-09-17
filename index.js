process.loadEnvFile();

const http = require('node:http');
const { URL } = require('node:url');
const helmet = require('helmet');
const morgan = require('./middleware/morgan.js');

const BASE_URL = 'https://sefinek.net/genshin-stella-mod';

const renderHtml = (res, msg, status, err = null) => {
	res.writeHead(status, { 'Content-Type': 'text/html' });
	res.end(`<h1>${status} ${msg}</h1>`);
	if (err) console.error(err);
};

const applyMiddlewares = (req, res) =>
	Promise.all([
		new Promise((resolve, reject) => helmet()(req, res, err => (err ? reject(err) : resolve()))),
		new Promise((resolve, reject) => morgan(req, res, err => (err ? reject(err) : resolve()))),
	]);

const server = http.createServer(async (req, res) => {
	try {
		await applyMiddlewares(req, res);

		if (req.method === 'GET') {
			const incoming = new URL(req.url, 'https://sefinek.net');
			const cleanPath = incoming.pathname === '/' ? '' : incoming.pathname.replace(/\/$/, '');

			const target = new URL(BASE_URL);
			target.pathname = `${target.pathname.replace(/\/$/, '')}${cleanPath}`;
			target.search = incoming.search || '';

			res.writeHead(301, { Location: target.toString() });
			return res.end();
		}

		renderHtml(res, 'Method Not Allowed', 405);
	} catch (err) {
		renderHtml(res, 'Internal Server Error', 500, err);
	}
});

server.listen(process.env.PORT, () => {
	if (process.env.NODE_ENV === 'production') {
		try {
			process.send('ready');
		} catch (err) {
			console.error('Failed to send ready signal to parent process.', err.message);
		}
	} else {
		console.log(`Server running at http://127.0.0.1:${process.env.PORT}`);
	}
});