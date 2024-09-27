const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const expressRateLimit = require('express-rate-limit');
const pako = require('pako');
const crypto = require('node:crypto');
const env = require('dotenv').config().parsed;

const CarbonObject = require('./carbonObject');
const Logger = require('./carbolog');

const savePath = 'save.gz';
const logPath = './logs';

const app = express();
const port = 3000;

const logger = new Logger(logPath);

app.disable('x-powered-by');
app.disable('etag');
app.use(express.json());

app.use(express.static('public'));

const limiter = expressRateLimit({
	windowMs: 60 * 1000,
	max: 100
});
app.use(limiter);

let objects = new Map();

let usernameToId = new Map();

let authCodes = [];

const publicKey = env.PUBLIC_KEY;
const privateKey = env.PRIVATE_KEY;

const doEncryption = process.argv.includes('--encrypt');

function generateRandom(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return 'COI-' + result;
}

function generateUnique(length, arr) {
	var result = '';
	do {
		result = generateRandom(length);
	} while (arr.includes(result));
	return result;
}

function createTimestamp() {
	const now = new Date();
	const millis = now.getTime();

	return millis;
}

function encrypt(data) {
	const buffer = Buffer.from(data, 'utf8');
	// Check if the data size is appropriate for the key size
	const keySizeInBytes = 256; // 2048-bit key size (common size)
	if (buffer.length > keySizeInBytes - 11) { // 11 is for padding
		throw new Error('Data is too large to encrypt with the provided public key');
	}
	const encrypted = crypto.publicEncrypt(publicKey, buffer);
	return encrypted.toString('base64');
}

function decrypt(encrypted) {
	const buffer = Buffer.from(encrypted, 'base64');
	// Check if the data size is appropriate for the key size
	const keySizeInBytes = 256; // 2048-bit key size (common size)
	if (buffer.length > keySizeInBytes - 11) { // 11 is for padding
		throw new Error('Data is too large to decrypt with the provided private key');
	}
	const decrypted = crypto.privateDecrypt(privateKey, buffer);
	return decrypted.toString('utf8');
}

function saveData() {
	let data = JSON.stringify({
		objects: JSON.stringify([...objects]),
		usernameToId: JSON.stringify([...usernameToId]),
		authCodes: authCodes
	});

	data = pako.deflate(data);

	if (doEncryption) {
		data = encrypt(data);
	}

	fs.writeFileSync(savePath, data);
}

function setup() {
	if (!fs.existsSync(savePath)) {
		return;
	}

	let data = fs.readFileSync(savePath);
	data = pako.inflate(data, { to: 'string' });

	if (!data || data === '') {
		return;
	}

	if (doEncryption) {
		data = decrypt(data);
	}

	const parsedData = JSON.parse(data);
	objects = new Map(JSON.parse(parsedData.objects));
	usernameToId = new Map(JSON.parse(parsedData.usernameToId));
	authCodes = parsedData.authCodes;
}

app.use((req, res, next) => {
	if ((req.method === 'POST' && (req.path === '/api/v1/auth' || req.path === '/api/v1/register')) || (req.method === 'GET' && (req.path === '/healthcheck'))) {
		return next();
	}

	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.sendStatus(401);
	}

	let authToken = authHeader.slice(7);

	const tokens = [...objects.values()].filter(t => t.code === authToken);

	if (tokens.length === 0) {
		return res.sendStatus(401);
	}

	const token = tokens[0];

	if (token.expiresAt < Date.now()) {
		return res.sendStatus(401);
	}

	req.user = token.userId;

	next();
});

app.use((req, res, next) => {
	res.on('finish', () => {
		saveData();
	});
	next();
});

app.use((req, res, next) => {
	res.on('finish', () => {
		logger.verbose(`${req.method} ${req.path} recieved from ${req.user || 'unknown user'} with the IP ${req.ip}. Response code ${res.statusCode}.`);
	});
	next();
});

app.post('/api/v1/register', (req, res) => {
	let { username, password } = req.body;

	if (!username || !password) {
		return res.sendStatus(400);
	}

	if (username.length < 3 || username.length > 32) {
		return res.sendStatus(400);
	}

	if (password.length < 3) {
		return res.sendStatus(400);
	}

	if (usernameToId.has(username)) {
		return res.sendStatus(409);
	}

	const hashedPassword = bcrypt.hashSync(password, 10);

	const userId = generateUnique(100, [...objects.keys()]);

	const user = new CarbonObject("carbon:user", {
		username,
		chats: [],
		passwordHash: hashedPassword
	});

	objects.set(userId, user);

	usernameToId.set(username, userId);

	const tokenId = generateUnique(100, [...objects.keys()]);

	const authCode = generateUnique(200, authCodes);

	authCodes.push(authCode);

	const token = new CarbonObject("carbon:token", {
		userId,
		code: authCode,
		expiresAt: Date.now() + (60 * 60 * 1000),
	});

	objects.set(tokenId, token);

	res.status(200).send(token);
});

app.post('/api/v1/auth', (req, res) => {
	let { username, password } = req.body;

	if (!username || !password) {
		return res.sendStatus(400);
	}

	if (!usernameToId.has(username)) {
		return res.sendStatus(401);
	}

	const userId = usernameToId.get(username);

	const user = objects.get(userId);

	if (!bcrypt.compareSync(password, user.passwordHash)) {
		return res.sendStatus(401);
	}

	const tokenId = generateUnique(100, [...objects.keys()]);

	const authCode = generateUnique(200, authCodes);

	authCodes.push(authCode);

	const token = new CarbonObject("carbon:token", {
		userId,
		code: authCode,
		expiresAt: Date.now() + (60 * 60 * 1000),
	});

	objects.set(tokenId, token);

	res.status(200).send(token);
});

app.post('/api/v1/updatePassword', (req, res) => {
	let { password } = req.body;

	if (!password) {
		return res.sendStatus(400);
	}

	const user = objects.get(req.user);

	user.password = bcrypt.hashSync(password, 10);

	res.sendStatus(200);
});

app.post('/api/v1/createChat', (req, res) => {
	let { name } = req.body;

	if (!name) {
		return res.sendStatus(400);
	}

	const chatId = generateUnique(100, [...objects.keys()]);

	const chat = new CarbonObject("carbon:chat", {
		name,
		creatorId: req.user,
		users: [req.user],
		messages: [],
	});

	objects.set(chatId, chat);

	let oldUser = objects.get(req.user);

	oldUser.chats.push(chatId);

	objects.delete(req.user);

	objects.set(req.user, oldUser);

	res.status(200).send({ chatId });
});

app.post('/api/v1/createChatMessage', (req, res) => {
	let { chatId, content } = req.body;

	if (!chatId || !content) {
		return res.sendStatus(400);
	}

	const chat = objects.get(chatId);

	if (![...chat.users].includes(req.user)) {
		return res.sendStatus(401);
	}

	const authorId = req.user.uuid;

	const message = new CarbonObject("carbon:message:chat_message", {
		authorId,
		content,
		timestamp: createTimestamp(),
	});

	chat.messages.push(message);

	res.sendStatus(200);
});

app.post('/api/v1/getChatMessages', (req, res) => {
	let { chatId } = req.body;

	if (!chatId) {
		return res.sendStatus(400);
	}

	const chat = objects.get(chatId);

	if (!chat.users.includes(req.user)) {
		return res.sendStatus(401);
	}

	res.status(200).send(chat.messages);
});

app.post('/api/v1/getInvolvedChats', (req, res) => {
	const invlovedChatIds = objects.get(req.user).chats;

	res.status(200).send(invlovedChatIds);
});

app.post('/api/v1/getChatUsers', (req, res) => {
	const { chatId } = req.body;

	if (!chatId) {
		return res.sendStatus(400);
	}

	const chat = objects.get(chatId);

	if (!chat.users.includes(req.user)) {
		return res.sendStatus(401);
	}

	res.status(200).send(chat.users);
});

app.get('/healthcheck', (req, res) => {
	res.sendStatus(200);
});

app.listen(port, () => {
	console.log(`Carbon listening on port ${port}`);
	logger.info(`Carbon listening on port ${port}`);

	setup();
});
