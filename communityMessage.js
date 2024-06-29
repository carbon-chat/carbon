const Message = require('./message');

class CommunityMessage extends Message {
    /**
     * Constructs a new instance of the class.
     *
     * @param {string} id - The id of the message.
     * @param {string} authorId - The author id.
     * @param {string} content - The content of the object.
     * @returns {CommunityMessage}
     */
    constructor(id, authorId, content) {
        super(id, authorId, content);
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
     * Creates a new CommunityMessage object from a JSON object.
     *
     * @param {Object} json - The JSON object representing a message.
     * @return {CommunityMessage} - The newly created Message object.
     */
    static fromJSON(json) {
        let user = new CommunityMessage(json.id, json.authorId, json.content);
        user.timestamp = json.timestamp;
    }
}

module.exports = CommunityMessage;
