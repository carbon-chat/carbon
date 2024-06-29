const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const yaml = require('js-yaml');
const expressRateLimit = require('express-rate-limit');

const User = require('./user');
const Token = require('./token');
const Chat = require('./chat');
const ChatMessage = require('./chatMessage');
const CommunityMessage = require('./communityMessage');
const { generateRandom, generateUnique } = require('./utils');

const config = require('./config.json');

const app = express();
const port = config.port;

app.disable('x-powered-by');
app.disable('etag');
app.use(express.json());

const limiter = expressRateLimit({
	windowMs: 60 * 1000,
	max: 100
});
app.use(limiter);

let tokens = [], authCodes = [], users = [], chats = [], userIds = [], messages = [], messageIds = [];

/**
 * Retrieves a user object from the list of users based on the provided UUID.
 *
 * @param {string} uuid - The UUID of the user to retrieve.
 * @return {User} The user object associated with the provided UUID.
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

	// Save data to file
	saveData();

	// Return the token object
	return token.toJSON();
}

/**
 * Authenticates a user by checking their username and password.
 *
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @return {Object} The token object for the authenticated user.
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

	// Check if user does not exist
	if (!user) {
		return;
	}

	// Compare the provided password with the user's password
	if (!bcrypt.compareSync(password, user.passwordHash)) {
		return;
	}

	// Remove any existing tokens for the user
	tokens = tokens.filter(t => t.uuid !== uuid);
	authCodes = authCodes.filter(c => c !== user.authCode);

	// Create a new token for the authenticated user
	const token = new Token(uuid, authCodes);

	// Add the token to the list of active tokens
	tokens.push(token);
	authCodes.push(token.authCode);

	// Save data to file
	saveData();

	// Return the token object
	return token.toJSON();
}


/**
 * Creates a chat between users.
 *
 * @param {string} name - A name for the chat.
 * @return {Object} Returns an object containing the ID of the newly created chat.
 */
function createChat(name, creator) {
	// Check if the name param is provided
	if (!name) {
		// If not, return undefined
		return;
	}

	// Check if the creator param is provided
	if (!creator) {
		// If not, return undefined
		return;
	}

	// Generate a random ID for the chat
	const id = generateRandom(70);

	// Create a new chat object and add it to the chats array
	chats.push(new Chat(id, creator, name));

	// Save the data
	saveData();

	// Return an object with the ID of the newly created chat
	return { id };
}

/**
 * Function to set up the application by checking file existence and loading saved data.
 * 
 * @return {void}
 */
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

	// Check if user ids are saved
	if (data.userIds && data.userIds.length > 0) {
		// Load the saved user ids
		userIds = data.userIds;
	}
}

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
 * @returns {number} 200 - If the user was registered successfully
 * @returns {number} 409 - If the user already exists
 * @returns {number} 400 - If the username or password is missing
 */
app.post('/api/register', (req, res) => {
	// Extract the username and password from the request body
	const { username, password } = req.body;

	// Check if username or password is missing
	if (!username || !password) {
		// Return 400 Bad Request status if username or password is missing
		return res.sendStatus(400);
	}

	// Check if the user already exists
	if (users.find(u => u.username === username)) {
		// Return 409 Conflict status if the user already exists
		return res.sendStatus(409);
	}

	// Get the auth code for the registered user and return it
	const auth = register(username, password);
	
	res.status(200).send(auth);
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

	res.status(200).send(authenticate(username, password));
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

	// Remove valid tokens for the user
	tokens = tokens.filter(t => t.uuid !== req.user.uuid);

	// Save the updated user
	saveData();

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * POST /api/logout
 * Log out a user.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {number} 200 - If the user was logged out successfully
 * @returns {number} 400 - If the request is invalid
 */
app.post('/api/logout', (req, res) => {
	// Get the user
	const user = users.find(u => u.username === req.user.username);

	// Check if the user exists
	if (!user) {
		return res.sendStatus(400);
	}

	// Remove valid tokens for the user
	tokens = tokens.filter(t => t.uuid !== req.user.uuid);

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * POST /api/deleteUser
 * Delete a user.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {number} 200 - If the user was deleted successfully
 * @returns {number} 400 - If the request is invalid
 */
app.post('/api/deleteUser', (req, res) => {
	// Get the user
	const user = users.find(u => u.uuid === req.user.uuid);

	// Check if the user exists
	if (!user) {
		return res.sendStatus(400);
	}

	// Remove the user from the list of users
	users = users.filter(u => u.uuid !== user.uuid);

	// Remove valid tokens for the user
	tokens = tokens.filter(t => t.uuid !== req.user.uuid);

	// Remove the user from any chats they are in and remove their messages
	chats = chats.map(c => {
		c.users = c.users.filter(u => u.username !== user.username);
		c.messages = c.messages.filter(m => m.uuid !== req.user.uuid);
		return c;
	});

	// Save the updated data
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
 * @returns {number} 200 - If the chat was created successfully
 * @returns {number} 409 - If the chat already exists
 */
app.post('/api/createChat', (req, res) => {
	// Extract name from the request body
	const { name } = req.body;

	// Check if name is missing
	if (!name) {
		// Return 400 Bad Request status if name is missing
		return res.sendStatus(400);
	}

	// Check if the chat already exists
	if (chats.find(c => c.name === name)) {
		// Return 409 Conflict status if the chat already exists
		return res.sendStatus(409);
	}

	// Find the creator
	const creator = users.find(u => u.uuid === req.user.uuid);

	// Check if the creator exists
	if (!creator) {
		// Return 404 Not Found status if the creator does not exist
		return res.sendStatus(400);
	}

	// Create a new chat
	const chatId = createChat(name, creator);

	// Save the updated list of chats
	saveData();

	res.status(200).send(chatId);
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
	const { chatId, content, replyId } = req.body;

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

	// Get the UUID of the author
	const authorId = req.user.uuid;

	let message;

	if (replyId) {
		// Create a new message object
		message = new ChatMessage(authorId, chat, content, replyId);
	} else {
		// Create a new message object
		message = new ChatMessage(authorId, chat, content);
	}

	// Send the message to the chat
	chat.sendMessage(message);

	// Save the updated chat
	saveData();

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
	res.status(200).send(messages);
});

/**
 * POST /api/deleteChat
 * Delete a chat
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 401 - If the user is not the creator of the chat
 * @returns {number} 404 - If the chat was not found
 * @returns {number} 200 - If the chat was deleted successfully
 */
app.post('/api/deleteChat', (req, res) => {
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

	// Check if the user is not the creator of the chat
	if (req.user.uuid !== chat.creatorId) {
		// Return 401 Unauthorized status if the user is not the creator of the chat
		return res.sendStatus(401);
	}

	// Delete the chat
	chats = chats.filter(c => c.id !== chatId);

	// Save the updated list of chats
	saveData();

	// Return 200 OK status
	res.sendStatus(200);
});

/**
 * POST /api/getInvlovedChats
 * Retrieve all chats that the user is a member of
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Array} - The array of chats
 * @returns {number} 200 - If the chats were retrieved successfully
 */
app.post('/api/getInvlovedChats', (req, res) => {
	// Filter chats that the user is a member of
	const invlovedChatIds = chats.filter(chat => chat.hasUser(req.user.uuid)).map(chat => chat.toJSON());

	// Return the list of invloved chat's IDs
	res.status(200).send(invlovedChatIds);
});

/**
 * POST /api/getChatUsers
 * Retrieve all users in a chat
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Array} - The array of users
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the chat was not found
 * @returns {number} 200 - If the users were retrieved successfully
 * @returns {number} 401 - If the user is not a member of the chat
 */
app.post('/api/getChatUsers', (req, res) => {
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

	// Retrieve users from the chat
	const users = chat.getUsers();

	// Send the retrieved users as response
	res.status(200).send(users);
});

/**
 * POST /api/createCommunityMessage
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the user was not found
 * @returns {number} 200 - If the message was created successfully
 */
app.post('/api/createCommunityMessage', (req, res) => {
	// Extract message from the request body
	const { message } = req.body;

	// Check if message is missing
	if (!message) {
		// Return 400 Bad Request status if message is missing
		return res.sendStatus(400);
	}

	// Generate a unique ID for the message
	const messageId = generateUnique(70, messageIds);
	messageIds.push(messageId);

	// Create the message
	const messageObject = new CommunityMessage(messageId, req.user.uuid, chats.find(c => c.id === req.body.chatId), message);

	// Add the message to the list of messages
	messages.push(messageObject);

	// Save the updated list of messages
	saveData();

	// Return 200 OK status
	res.sendStatus(200);
});

/**
 * POST /api/addUserIcon
 * Add an icon to a user
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the user was not found
 * @returns {number} 200 - If the icon was added successfully
 */
app.post('/api/addUserIcon', (req, res) => {
	// Extract icon from the request body
	const { icon } = req.body;

	// Check if icon is missing
	if (!icon) {
		// Return 400 Bad Request status if icon is missing
		return res.sendStatus(400);
	}

	// Find the user with the matching UUID
	const user = users.find(u => u.uuid === req.user.uuid);

	// Check if user does not exist
	if (!user) {
		// Return 404 Not Found status if user does not exist
		return res.sendStatus(404);
	}

	// Add the icon to the user
	user.addIcon(icon);

	// Save the updated user
	saveData();

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * POST /api/getUserIcon
 * Retrieve an icon from a user
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 404 - If the user was not found
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 200 - If the icon was retrieved successfully
 */
app.post('/api/getUserIcon', (req, res) => {
	// Extract userId from the request body
	const { userId } = req.body;

	// Check if userId is missing
	if (!userId) {
		// Return 400 Bad Request status if userId is missing
		return res.sendStatus(400);
	}

	// Find the user with the matching UUID
	const user = users.find(u => u.uuid === userId);

	// Check if user does not exist
	if (!user) {
		// Return 404 Not Found status if user does not exist
		return res.sendStatus(404);
	}

	// Return the user's icon
	res.status(200).send(user.getIcon());
});

/**
 * POST /api/followUser
 * Follow a user
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the user was not found
 * @returns {number} 200 - If the user was followed successfully
 */
app.post('/api/followUser', (req, res) => {
	// Extract userId from the request body
	const { userId } = req.body;

	// Check if userId is missing
	if (!userId) {
		// Return 400 Bad Request status if userId is missing
		return res.sendStatus(400);
	}

	// Find the user with the matching UUID
	const user = users.find(u => u.uuid === userId);

	// Check if user does not exist
	if (!user) {
		// Return 404 Not Found status if user does not exist
		return res.sendStatus(404);
	}

	// Find the follower
	const follower = users.find(u => u.uuid === req.user.uuid);

	// Follow the user
	user.addFollower(follower);

	// Save the updated user
	saveData();

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * POST /api/unfollowUser
 * Unfollow a user
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the user was not found
 * @returns {number} 200 - If the user was unfollowed successfully
 */
app.post('/api/unfollowUser', (req, res) => {
	// Extract userId from the request body
	const { userId } = req.body;

	// Check if userId is missing
	if (!userId) {
		// Return 400 Bad Request status if userId is missing
		return res.sendStatus(400);
	}

	// Find the user with the matching UUID
	const user = users.find(u => u.uuid === userId);

	// Check if user does not exist
	if (!user) {
		// Return 404 Not Found status if user does not exist
		return res.sendStatus(404);
	}

	// Find the unfollower
	const unfollower = users.find(u => u.uuid === req.user.uuid);

	// Unfollow the user
	user.removeFollower(unfollower);

	// Save the updated user
	saveData();

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * POST /api/sendBanner
 * Send a banner to a user
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 404 - If the user was not found
 * @returns {number} 200 - If the user was sent a banner successfully
 */
app.post('/api/sendBanner', (req, res) => {
	// Extract userId from the request body
	const { userId, bannerId } = req.body;

	// Check if userId is missing
	if (!userId) {
		// Return 400 Bad Request status if userId is missing
		return res.sendStatus(400);
	}

	// Find the user with the matching UUID
	const user = users.find(u => u.uuid === userId);

	// Check if user does not exist
	if (!user) {
		// Return 404 Not Found status if user does not exist
		return res.sendStatus(404);
	}

	// Find the sender
	const sender = users.find(u => u.uuid === req.user.uuid);

	// Send the user a banner
	user.sendBanner(sender, bannerId);

	// Save the updated user
	saveData();

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * POST /api/suspension
 * Suspend a user
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {number} 400 - If the request is invalid
 * @returns {number} 403 - If the user does not have permissions to suspend
 * @returns {number} 200 - If the user was suspended successfully
 */
app.post('/api/suspension', (req, res) => {
	// Extract userId from the request body
	const { userId, suspensionLevel } = req.body;

	// Check if the user has permissions to suspend
	if (!req.user.isAdmin) {
		// Return 403 Forbidden status if the user does not have permissions to suspend
		return res.sendStatus(403);
	}

	// Check if userId is missing
	if (!userId) {
		// Return 400 Bad Request status if userId is missing
		return res.sendStatus(400);
	}

	// Find the user with the matching UUID
	const user = users.find(u => u.uuid === userId);

	// Check if user does not exist
	if (!user) {
		// Return 404 Not Found status if user does not exist
		return res.sendStatus(400);
	}

	// Suspend the user
	user.setSuspensionLevel(suspensionLevel);

	// Save the updated user
	saveData();

	// Return 200 OK
	res.sendStatus(200);
});

/**
 * GET /healthcheck
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
