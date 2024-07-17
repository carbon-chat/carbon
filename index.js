const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const expressRateLimit = require('express-rate-limit');

const CarbonObject = require('./carbonObject');

const savePath = 'save.json';

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

function saveData() {
	fs.writeFileSync(savePath, JSON.stringify(objects.entries()));
}

function register(username, password) {
	if (!username || !password) {
		return;
	}

	if (usernameToId.has(username)) {
		return;
	}

	const hashedPassword = bcrypt.hashSync(password, 10);

	const userId = generateUnique(100, objects.keys());

	const user = new CarbonObject("carbon:user", {
		username,
		passwordHash: hashedPassword
	});

	objects.set(userId, user);

	usernameToId.set(username, userId);

	const tokenId = generateUnique(100, objects.keys());

	const authCode = generateUnique(200, authCodes);

	authCodes.push(authCode);

	const token = new CarbonObject("carbon:token", {
		userId,
		code: authCode,
		expiresAt: Date.now() + (60 * 60 * 1000),
	});

	objects.set(tokenId, token);

	saveData();

	return tokenId;
}

function authenticate(username, password) {
	if (!username || !password) {
		return;
	}

	const userId = usernameToId.get(username);

	const user = objects.get(userId);

	if (!bcrypt.compareSync(password, user.passwordHash)) {
		return;
	}

	const tokenId = generateUnique(100, objects.keys());

	const authCode = generateUnique(200, authCodes);

	authCodes.push(authCode);

	const token = new CarbonObject("carbon:token", {
		userId,
		code: authCode,
		expiresAt: Date.now() + (60 * 60 * 1000),
	});

	objects.set(tokenId, token);

	saveData();

	return tokenId;
}

function createChat(name, creator) {
	const chatId = generateUnique(100, objects.keys());

	const chat = new CarbonObject("carbon:chat", {
		name,
		creator,
		users: [creator],
		messages: [],
	});

	objects.set(chatId, chat);

	saveData();

	return chatId;
}

function setup() {
	if (!fs.existsSync(savePath) || !fs.statSync(savePath).isFile() || fs.statSync(savePath).size === 0) {
		return;
	}

	const file = fs.readFileSync(savePath);
	const data = JSON.parse(file);

	objects = new Map(data);
}

app.use((req, res, next) => {
	if ((req.method === 'POST' && (req.path === '/api/auth' || req.path === '/api/register')) || (req.method === 'GET' && req.path === '/healthcheck')) {
		return next();
	}

	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.sendStatus(401);
	}

	const authToken = authHeader.slice(7);

	const tokens = objects.values().filter(t => t.code === authToken);

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

app.post('/api/register', (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.sendStatus(400);
	}

	if (usernameToId.has(username)) {
		return res.sendStatus(409);
	}

	const tokenId = register(username, password);

	res.status(200).send(objects.get(tokenId));
});

app.post('/api/auth', (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.sendStatus(400);
	}

	if (usernameToId.has(username)) {
		return res.sendStatus(409);
	}

	const tokenId = authenticate(username, password);

	res.status(200).send(objects.get(tokenId));
});

app.post('/api/updatePassword', (req, res) => {
	const { password } = req.body;

	if (!password) {
		return res.sendStatus(400);
	}

	const user = objects.get(req.user);

	user.password = bcrypt.hashSync(password, 10);

	saveData();

	res.sendStatus(200);
});

app.post('/api/createChat', (req, res) => {
	const { name } = req.body;

	if (!name) {

		return res.sendStatus(400);
	}

	if (objects.entries().find(c => c.name === name)) {
		return res.sendStatus(409);
	}

	const creator = objects.get(req.user);

	const chatId = createChat(name, creator);

	saveData();

	res.status(200).send(chatId);
});

app.post('/api/createChatMessage', (req, res) => {
	const { chatId, content } = req.body;

	if (!chatId || !content) {
		return res.sendStatus(400);
	}

	const chat = objects.get(chatId);

	if (!chat.users.contains(req.user)) {
		return res.sendStatus(401);
	}

	const authorId = req.user.uuid;

	const message = new CarbonObject("carbon:message:chat_message", {
		authorId,
		content,
		timestamp: createTimestamp(),
	});

	chat.messages.append(message);

	saveData();

	res.sendStatus(200);
});

app.post('/api/getChatMessages', (req, res) => {
	const { chatId } = req.body;

	if (!chatId) {
		return res.sendStatus(400);
	}

	const chat = objects.get(chatId);

	if (!chat.hasUser(req.user)) {
		return res.sendStatus(401);
	}

	res.status(200).send(chat.messages);
});

app.post('/api/getInvlovedChats', (req, res) => {
	const invlovedChatIds = objects.keys().filter(id => objects.get(id).users.contains(req.user));

	res.status(200).send(invlovedChatIds);
});

app.post('/api/getChatUsers', (req, res) => {
	const { chatId } = req.body;

	if (!chatId) {
		return res.sendStatus(400);
	}

	const chat = objects.get(chatId);

	if (!chat.hasUser(req.user.uuid)) {
		return res.sendStatus(401);
	}

	res.status(200).send(chat.users);
});

app.get('/healthcheck', (req, res) => {
	res.sendStatus(200);
});

app.listen(port, () => {
	console.info(`Carbon listening on port ${port}`);

	setup();

	setInterval(() => {
		saveData();
	}, 50);
});
