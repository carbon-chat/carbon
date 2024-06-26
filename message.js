const { createTimestamp } = require('./utils');

class Message {
    /**
     * Constructs a new instance of the class.
     *
     * @param {string} id - The id of the message.
     * @param {string} authorId - The author id.
     * @param {string} content - The content of the object.
     * @returns {Message}
     */
    constructor(id, authorId, content) {
        this.id = id;
        this.authorId = authorId;
        this.content = content;

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
            content: this.content,
            timestamp: this.timestamp,
        };
    }

    /**
     * Creates a new Message object from a JSON object.
     *
     * @param {Object} json - The JSON object representing a message.
     * @return {Message} - The newly created Message object.
     */
    static fromJSON(json) {
        let user = new Message(json.id, json.authorId, json.content);
        user.timestamp = json.timestamp;
    }
}

module.exports = Message;
