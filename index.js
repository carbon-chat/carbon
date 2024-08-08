const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const expressRateLimit = require('express-rate-limit');
const pako = require('pako');
const crypto = require('crypto');
const env = require('dotenv').config();

const CarbonObject = require('./carbonObject');

const savePath = 'save.gz';

const app = express();
const port = 3000;

app.disable('x-powered-by');
app.disable('etag');
app.use(express.json());

const limiter = expressRateLimit({
	windowMs: 60 * 1000,
	max: 100
});
app.use(limiter);

let objects = new Map();

let usernameToId = new Map();

let userIdToKey = new Map();

let authCodes = [];

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
	const date = now.toLocaleString('en-US', {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});

	return {
		millis,
		date
	};
}

function encrypt(data, publicKey) {
	const buffer = Buffer.from(data, 'utf8');
	const encrypted = crypto.publicEncrypt(publicKey, buffer);
	return encrypted.toString('base64');
}

function decrypt(encrypted, privateKey) {
	const buffer = Buffer.from(encrypted, 'base64');
	const decrypted = crypto.privateDecrypt(privateKey, buffer);
	return decrypted.toString('utf8');
}

function saveData() {
	const serializedData = JSON.stringify({
		objects: JSON.stringify([...objects]),
		usernameToId: JSON.stringify([...usernameToId]),
		userIdToKey: JSON.stringify([...userIdToKey]),
		authCodes: authCodes
	});

	const compressedData = pako.deflate(serializedData);

	const encryptedData = encrypt(compressedData, env.PUBLIC_KEY);

	fs.writeFileSync(savePath, encryptedData);
}

function setup() {
	if (!fs.existsSync(savePath)) {
		return;
	}

	const compressedDataFromFile = fs.readFileSync(savePath);
	const decompressedData = pako.inflate(compressedDataFromFile, { to: 'string' });

	if (!decompressedData) {
		return;
	}

	if (decompressedData === '') {
		return;
	}

	const decryptedData = decrypt(decompressedData, env.PRIVATE_KEY);

	const parsedData = JSON.parse(decryptedData);
	objects = new Map(JSON.parse(parsedData.objects));
	usernameToId = new Map(JSON.parse(parsedData.usernameToId));
	userIdToKey = new Map(JSON.parse(parsedData.userIdToKey));
	authCodes = parsedData.authCodes;
}

app.use((req, res, next) => {
	if ((req.method === 'POST' && (req.path === '/api/v1/auth' || req.path === '/api/v1/register')) || (req.method === 'GET' && (req.path === '/healthcheck' || req.path === '/api/v1/getKey'))) {
		return next();
	}

	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.sendStatus(401);
	}

	const authToken = authHeader.slice(7);

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

app.get('/api/v1/getKey', (req, res) => {
	res.status(200).send({ publicKey: env.PUBLIC_KEY });
});

app.post('/api/v1/register', (req, res) => {
	let { username, password, publicKey } = req.body;

	if (!username || !password) {
		return res.sendStatus(400);
	}

	username = decrypt(username, env.PRIVATE_KEY);
	password = decrypt(password, env.PRIVATE_KEY);

	publicKey = decrypt(publicKey, env.PRIVATE_KEY);

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
		passwordHash: hashedPassword
	});

	objects.set(userId, user);

	usernameToId.set(username, userId);

	userIdToKey.set(userId, publicKey);

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

	username = decrypt(username, env.PRIVATE_KEY);
	password = decrypt(password, env.PRIVATE_KEY);

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

	password = decrypt(password, env.PRIVATE_KEY);

	const user = objects.get(req.user);

	user.password = bcrypt.hashSync(password, 10);

	res.sendStatus(200);
});

app.post('/api/v1/createChat', (req, res) => {
	let { name } = req.body;

	if (!name) {
		return res.sendStatus(400);
	}

	name = decrypt(name, env.PRIVATE_KEY);

	if (objects.entries().find(c => c.name === name)) {
		return res.sendStatus(409);
	}

	const chatId = generateUnique(100, [...objects.keys()]);

	const chat = new CarbonObject("carbon:chat", {
		name,
		creatorId: req.user,
		users: [req.user],
		messages: [],
	});

	objects.set(chatId, chat);

	res.status(200).send({ chatId });
});

app.post('/api/v1/createChatMessage', (req, res) => {
	let { chatId, content } = req.body;

	if (!chatId || !content) {
		return res.sendStatus(400);
	}

	chatId = decrypt(chatId, env.PRIVATE_KEY);
	content = decrypt(content, env.PRIVATE_KEY);

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

	chatId = decrypt(chatId, env.PRIVATE_KEY);

	const chat = objects.get(chatId);

	if (!chat.users.includes(req.user)) {
		return res.sendStatus(401);
	}

	res.status(200).send(encrypt(chat.messages, userIdToKey.get(req.user)));
});

app.post('/api/v1/getInvlovedChats', (req, res) => {
	const invlovedChatIds = [...objects.keys()].filter(id => objects.get(id).users.includes(req.user));

	res.status(200).send(encrypt(invlovedChatIds, userIdToKey.get(req.user)));
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

	res.status(200).send(encrypt(chat.users, userIdToKey.get(req.user)));
});

app.get('/healthcheck', (req, res) => {
	res.sendStatus(200);
});

app.listen(port, () => {
	console.info(`Carbon listening on port ${port}`);

	setup();
});
