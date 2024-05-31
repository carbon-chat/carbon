const { createTimestamp } = require('./utils');

class Message {
    /**
     * Constructs a new instance of the class.
     *
     * @param {string} id - The id of the message.
     * @param {string} authorId - The author id.
     * @param {string} chatId - The chat id.
     * @param {string} content - The content of the object.
     * @param {string} reply - The reply of the object.
     * @returns {Message}
     */
    constructor(id, authorId, chatId, content, reply = null) {
        this.id = id;
        this.authorId = authorId;
        this.chatId = chatId;
        this.content = content;
        this.reply = reply;

        this.millis, this.time = createTimestamp();
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
            reply: this.reply,
        };
    }

    /**
     * Creates a new Message object from a JSON object.
     *
     * @param {Object} json - The JSON object representing a message.
     * @return {Message} - The newly created Message object.
     */
    static fromJSON(json) {
        let user = new Message(json.id, json.authorId, json.chatId, json.content);
        user.timestamp = json.timestamp;
        if(json.reply) user.reply = json.reply;
    }
}

module.exports = Message;
