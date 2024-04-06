const { createTimestamp } = require('./utils');

class Message {
    /**
     * Constructs a new instance of the class.
     *
     * @param {string} id - The id of the message.
     * @param {string} authorId - The author id.
     * @param {string} chatId - The guild id.
     * @param {string} content - The content of the object.
     * @param {Array} badges - The badges of the object.
     */
    constructor(id, authorId, chatId, content) {
        this.id = id;
        this.authorId = authorId;
        this.chatId = chatId;
        this.content = content;

        this.millis, this.time = createTimestamp();
    }

    /**
     * Sets the timestamp value.
     *
     * @param {Object} timestamp - The timestamp value to set.
     */
    setTimestamp(timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * Converts the object to a JSON representation.
     *
     * @return {Object} The JSON representation of the object.
     */
    toJSON() {
        return {
            id: this.id,
            authorId: this.authorId,
            chatId: this.chatId,
            content: this.content,
            timestamp: this.timestamp,
            badges: this.badges
        }
    }

    /**
     * Creates a new Message object from a JSON object.
     *
     * @param {Object} json - The JSON object representing a message.
     * @return {Message} - The newly created Message object.
     */
    static fromJSON(json) {
        return new Message(json.id, json.authorId, json.chatId, json.content, json.badges).setTimestamp(json.timestamp);
    }
}

module.exports = Message;