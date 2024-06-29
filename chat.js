class Chat {
    /**
     * Initializes a new instance of the class.
     *
     * @param {string} id - The ID of the chat.
     * @param {User} creator - The creator of the chat.
     * @param {string} name - The name of the chat.
     * @returns {Chat}
     */
    constructor(id, creator, name) {
        this.creator = creator;
        this.creatorId = creator.uuid;
        this.users = [];
        this.users.push(creator);
        this.id = id;
        this.messages = [];
        this.name = name;
        this.messageIds = [];
    }

    /**
     * Adds a message to the list of messages.
     *
     * @param {Object} message - The message to be added.
     * @returns {void}
     */
    sendMessage(message) {
        this.messages.push(message);
    }

    /**
     * Get the messages of the DM.
     *
     * @return {Array} The messages.
     */
    getMessages() {
        return this.messages;
    }

    /**
     * Gets a message from a message ID.
     * 
     * @param {string} id - The ID of the message to get.
     * @returns {Message} The message with the given ID.
     */
    getMessage(id) {
        return this.messages.find(message => message.id === id);
    }

    /**
     * Deletes a message from the list of messages.
     *
     * @param {string} id - The ID of the message to be deleted.
     * @returns {void}
     */
    deleteMessage(id) {
        this.messages = this.messages.filter(message => message.id !== id);
    }

    /**
     * Checks if the given UUID exists in the users array.
     *
     * @param {string} uuid - The UUID to check.
     * @return {boolean} Returns true if the UUID exists in the users array, false otherwise.
     */
    hasUser(uuid) {
        return this.users.some(user => user.uuid === uuid);
    }

    /**
     * Adds a user to the list of users.
     *
     * @param {User} user - The user to be added.
     * @returns {void}
     */
    addUser(user) {
        this.users.push(user);
    }

    /**
     * Removes a user from the list of users.
     *
     * @param {string} uuid - The UUID of the user to be removed.
     * @returns {void}
     */
    removeUser(uuid) {
        this.users = this.users.filter(user => user.uuid !== uuid);
    }

    /**
     * Get the list of users.
     *
     * @return {Array} The list of users.
     */
    getUsers() {
        return this.users;
    }

    /**
     * Get the name of the chat.
     *
     * @return {string} The name of the chat.
     */
    getName() {
        return this.name;
    }

    /**
     * Get the ID of the chat.
     *
     * @return {string} The ID of the chat.
     */
    getId() {
        return this.id;
    }

    /**
     * Get the ID of the creator of the chat.
     *
     * @return {string} The ID of the creator of the chat.
     */
    getCreatorId() {
        return this.creatorId;
    }

    /*
     * Set the name of the chat.
     *
     * @param {string} name - The new name of the chat.
     * @return {void}
     */
    setName(name) {
        this.name = name;
    }

    /*
    * Converts the object to JSON.
    *
    * @return {Object} The object as JSON.
    */
    toJSON() {
        return {
            id: this.id,
            creator: this.creator,
            creatorId: this.creatorId,
            name: this.name,
            users: this.users,
            messages: this.messages,
        };
    }

    /*
     * Creates a new Chat instance from a JSON object.
     *
     * @param {Object} json - The JSON object representing a chat.
     * @return {Chat} - The newly created Chat instance.
     */
    static fromJSON(json) {
        let chat = new Chat(json.id, json.creatorId, json.name);
        chat.users = json.users;
        chat.messages = json.messages;
        return chat;
    }
}

module.exports = Chat;
