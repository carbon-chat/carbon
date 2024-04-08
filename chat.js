class Chat {
    /**
     * Initializes a new instance of the class.
     *
     * @param {string} id - The ID of the chat.
     * @param {string} creatorId - The ID of the creator of the chat.
     * @param {string} name - The name of the chat.
     */
    constructor(id, creator, name) {
        this.creator = creator;
        this.users = [];
        this.users.push(creator);
        this.id = id;
        this.messages = [];
        this.name = name;
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
     * Checks if the given UUID exists in the users array.
     *
     * @param {string} uuid - The UUID to check.
     * @return {boolean} Returns true if the UUID exists in the users array, false otherwise.
     */
    hasUser(uuid) {
        return this.users.some(user => user === uuid);
    }

    /**
     * Adds a user to the list of users.
     *
     * @param {string} uuid - The UUID of the user to be added.
     * @returns {void}
     */
    addUser(uuid) {
        this.users.push(uuid);
    }

    /**
     * Removes a user from the list of users.
     *
     * @param {string} uuid - The UUID of the user to be removed.
     * @returns {void}
     */
    removeUser(uuid) {
        this.users = this.users.filter(user => user !== uuid);
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