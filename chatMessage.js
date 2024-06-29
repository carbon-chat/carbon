const Message = require('./message');
const { createUnique } = require('./utils');

class ChatMessage extends Message {
    /**
     * Constructs a new instance of the class.
     *
     * @param {string} authorId - The author id.
     * @param {Chat} chat - The chat.
     * @param {string} content - The content of the object.
     * @param {string} replyId - The reply id (optional).
     * @returns {ChatMessage}
     */
    constructor(authorId, chat, content, replyId = null) {
        const id = createUnique(70, chat.messageIds);

        chat.messageIds.push(id);

        super(id, authorId, content);

        this.replyId = replyId;
        this.chat = chat;
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
            chat: this.chat,
            content: this.content,
            timestamp: this.timestamp,
            replyId: this.replyId
        };
    }

    /**
     * Creates a new ChatMessage object from a JSON object.
     *
     * @param {Object} json - The JSON object representing a message.
     * @return {ChatMessage} - The newly created Message object.
     */
    static fromJSON(json) {
        let user = new ChatMessage(json.id, json.authorId, json.chatId, json.content);
        user.replyId = json.replyId;
        user.timestamp = json.timestamp;
    }
}

module.exports = ChatMessage;
