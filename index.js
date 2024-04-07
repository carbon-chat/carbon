const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const yaml = require('js-yaml');

const User = require('./user');
const Token = require('./token');
const Chat = require('./chat');
const Message = require('./message');
const { generateRandom, generateUnique } = require('./utils');

const config = require('./config.json');

const app = express();
const port = 3000;

let tokens = [], authCodes = [], users = [], chats = [], messageIds = [], userIds = [];

/**
 * Retrieves a user object from the list of users based on the provided UUID.
 *
 * @param {string} uuid - The UUID of the user to retrieve.
 * @return {Object} The user object associated with the provided UUID.
 */
function getUserFromUUID(uuid) {
	return users.find(u => u.uuid === uuid);
}

/**
 * Finds the UUID associated with a given username.
 *
 * @param {string} username - The username to search for.
 * @return {string} The UUID associated with the given username.
 */
function findUUIDfromUsername(username) {
	return users.find(u => u.username === username).uuid;
}

/**
 * Saves the data to a YAML file.
 *
 * @return {void}
 */
function saveData() {
	fs.writeFileSync(config.dataSavePath, yaml.dump({ chats: chats.map(c => c.toJSON()), tokens: tokens.map(t => t.toJSON()), authCodes, users: users.map(u => u.toJSON()), messageIds, userIds }));
}

/**
 * Registers a new user.
 *
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @return {Object} The token object for the registered user.
 */
function register(username, password) {
	// Check if both the username and password are provided
	if (!username || !password) {
		return;
	}

	// Check if the username already exists in the `users` array
	if (users.find(u => u.username === username)) {
		return;
	}

	// Hash the provided password
	const hashedPassword = bcrypt.hashSync(password, 10);

	// Generate a random UUID
	const uuid = generateUnique(100, userIds);

	// Create a new User instance with the provided username and hashed password
	const user = new User(username, hashedPassword, uuid);

	// Add the new user to the `users` array
	users.push(user);

	// Create a new Token instance for the user
	const token = new Token(user.uuid, authCodes);

	// Add the token to the `tokens` array
	tokens.push(token);

	// Add the token's authCode to the `authCodes` array
	authCodes.push(token.authCode);

	// Return the token object
	return token.toJSON();
}

/**
 * Authenticates a user by checking their username and password.
 *
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @return {object} The token object for the authenticated user.
 */
function authenticate(username, password) {
	// Check if username or password is missing
	if (!username || !password) {
		return;
	}

	// Find the UUID associated with the given username
	const uuid = findUUIDfromUsername(username);

	// Check if UUID was found
	if (!uuid) {
		return;
	}

	// Find the user with the matching UUID
	const user = users.find(u => u.uuid === uuid);

	// Compare the provided password with the user's password
	if (!bcrypt.compareSync(password, user.password)) {
		return;
	}

	// Create a new token for the authenticated user
	const token = new Token(uuid, authCodes);

	// Add the token to the list of active tokens
	tokens.push(token);
	authCodes.push(token.authCode);

	// Return the token object
	return token.toJSON();
}


/**
 * Creates a chat between users.
 *
 * @param {string} name - A name for the chat.
 * @return {Object} Returns an object containing the ID of the newly created chat.
 */
function createChat(name, creatorId) {
	// Check if the name param is provided
	if (!name) {
		// If not, return undefined
		return;
	}

	// Generate a random ID for the chat
	const id = generateRandom(70);

	// Create a new chat object and add it to the dms array
	chats.push(new Chat(id, creatorId, name));

	// Return an object with the ID of the newly created chat
	return { id };
}

function setup() {
	// Check if the data.json file exists
	if (!fs.existsSync(config.dataSavePath) || !fs.statSync(config.dataSavePath).isFile() || fs.statSync(config.dataSavePath).size === 0) {
		// If the data.json file does not exist, return
		return;
	}

	// First, get the data
	const file = fs.readFileSync(config.dataSavePath);
	const data = yaml.load(file.toString());

	// Check if tokens are saved
	if (data.tokens && data.tokens.length > 0) {
		// Load the saved tokens
		tokens = data.tokens.map(t => Token.fromJSON(t, authCodes));
	}

	// Check if chats are saved
	if (data.chats && data.chats.length > 0) {
		// Load the saved dms
		chats = data.chats.map(s => Chat.fromJSON(s));
	}

	// Check if users are saved
	if (data.users && data.users.length > 0) {
		// Load the saved users
		users = data.users.map(u => User.fromJSON(u));
	}

	// Check if message ids are saved
	if (data.messageIds && data.messageIds.length > 0) {
		// Load the saved message ids
		messageIds = data.messageIds;
	}

	// Check if user ids are saved
	if (data.userIds && data.userIds.length > 0) {
		// Load the saved user ids
		userIds = data.userIds;
	}
}

app.disable('x-powered-by');
app.disable('etag');
app.use(express.json());

/**
 * Middleware to authenticate requests.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {void}
*/
app.use((req, res, next) => {
	// Allow POST requests to /api/auth and /api/register without authentication
	if ((req.method === 'POST' && (req.path === '/api/auth' || req.path === '/api/register')) || (req.method === 'GET' && req.path === '/healthcheck')) {
		return next();
	}

	// Check if the request has an authorization header
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		// Return 401 Unauthorized if no authorization header or invalid format
		return res.sendStatus(401);
	}

	// Extract the token from the authorization header
	const authToken = authHeader.slice(7);

	// Find the token in the list of tokens
	const token = tokens.find(t => t.authCode === authToken);

	// Check if the token exists and is not expired
	if (!token || token.expiresAt < Date.now()) {
		// Return 401 Unauthorized if token is invalid or expired
		return res.sendStatus(401);
	}

	// Get the user associated with the token's UUID
	req.user = getUserFromUUID(token.uuid);

	// Continue with the next middleware
	next();
});

/**
 * POST /api/register
 * Endpoint to register a new user.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - The HTTP response with the user's token.
 */
app.post('/api/register', (req, res) => {
	// Extract the username and password from the request body
	const { username, password } = req.body;

	res.send(register(username, password));
});

/**
 * POST /api/auth
 * Handle POST request to authenticate a user.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - The HTTP response with the user's token.
 */
app.post('/api/auth', (req, res) => {
	// Extract the username and password from the request body
	const { username, password } = req.body;

	res.send(authenticate(username, password));
});

/**
 * POST /api/updatePassword
 * Update a user's password.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {number} 200 - If the password was updated successfully
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the user was not found
 */
app.post('/api/updatePassword', (req, res) => {
	// Extract the password from the request body
	const { password } = req.body;

	// Check if all required fields are present
	if (!password) {
		return res.sendStatus(400);
	}

	// Get the user
	const user = users.find(u => u.username === req.user.username);

	// Check if the user exists
	if (!user) {
		return res.sendStatus(404);
	}

	// Update the user's password
	user.password = bcrypt.hashSync(password, 10);

	// Save the updated user
	saveData();

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * POST /api/createchat
 * Create a new chat
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Object} - The ID of the created chat
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the user was not found
 * @returns {number} 200 - If the chat was created successfully
 * @returns {number} 409 - If the chat already exists
 */
app.post('/api/createChat', (req, res) => {
	// Extract name from the request body
	const { name } = req.body;

	res.send(createChat(name, req.user.uuid));
});

/**
 * POST /api/createChatMessage
 * Create a new message in a chat
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the chat was not found
 * @returns {number} 200 - If the message was created successfully
 * @returns {number} 401 - If the user is not a member of the chat
 */
app.post('/api/createChatMessage', (req, res) => {
	// Extract chatId and content from the request body
	const { chatId, content } = req.body;

	// Check if chatId or content is missing
	if (!chatId || !content) {
		// Return 400 Bad Request status if either is missing
		return res.sendStatus(400);
	}

	// Find the chat with the matching chatId
	const chat = chats.find(c => c.id === chatId);

	// Check if the chat does not exist
	if (!chat) {
		// Return 404 Not Found status if the chat does not exist
		return res.sendStatus(404);
	}

	// Check if the user is a member of the chat
	if (!chat.hasUser(req.user.uuid)) {
		// Return 401 Unauthorized status if the user is not a member of the chat
		return res.sendStatus(401);
	}

	// Generate a unique ID for the message
	const id = generateUnique(70, messageIds);

	// Add the message ID to the messageIds array
	messageIds.push(id);

	// Get the UUID of the author
	const authorId = req.user.uuid;

	// Create a new message object
	const message = new Message(id, authorId, chatId, content);

	// Send the message to the chat
	chat.sendMessage(message);

	// Return 200 OK status
	res.sendStatus(200);
});

/**
 * POST /api/getMessages
 * Retrieve messages from a chat
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Array} - The array of messages
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the chat was not found
 * @returns {number} 200 - If the messages were retrieved successfully
 * @returns {number} 401 - If the user is not a member of the chat
 */
app.post('/api/getChatMessages', (req, res) => {
	// Extract ChatID from the request body
	const { chatId } = req.body;

	// Check if ChatID is missing
	if (!chatId) {
		// Return 400 Bad Request status if ChatID is missing
		return res.sendStatus(400);
	}

	// Find the chat with the matching chat ID
	const chat = chats.find(s => s.id === chatId);

	// Check if chat does not exist
	if (!chat) {
		// Return 404 Not Found status if chat does not exist
		return res.sendStatus(404);
	}

	// Check if the user is not a member of the chat
	if (!chat.hasUser(req.user.uuid)) {
		// Return 401 Unauthorized status if the user is not a member of the chat
		return res.sendStatus(401);
	}

	// Retrieve messages from the chat
	const messages = chat.getMessages();

	// Send the retrieved messages as response
	res.send(messages);
});

/*
 * GET /api/getInvlovedChats
 * Retrieve all chats that the user is a member of
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Array} - The array of chats
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 200 - If the chats were retrieved successfully
 */
app.get('/api/getInvlovedChats', (req, res) => {
	// Get the UUID of the user
	const uuid = req.user.uuid;

	// Declare a list of invloved chat's IDs
	const invlovedChatIds = [];

	// Iterate over all chats
	chats.forEach(chat => {
		// If the user is a member of the chat
		if (chat.hasUser(uuid)) {
			// Add the chat's ID to the list
			invlovedChatIds.push(chat.id);
		}
	});

	// Return the list of invloved chat's IDs
	res.send(invlovedChatIds);
});

/**
 * POST /api/healthcheck
 * Check the health of the server
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 200 - If the server is healthy
 */
app.get('/healthcheck', (req, res) => {
	// Return 200 OK status
	res.sendStatus(200);
});

// Start the server listening on the specified port
app.listen(port, () => {
	// Log a message indicating that the server is listening
	console.info(`Carbon listening on port ${port}`);

	setup();

	// Every 50 milliseconds save the data to disk
	setInterval(() => {
		saveData();
	}, 50);
});