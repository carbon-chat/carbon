// eslint-disable-next-line no-unused-vars
class CarbonAPI {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = null;
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        }
    }

    async get(path) {
        const response = await fetch(`${this.baseURL}/${path}`, { headers: this.headers });
        const json = await response.json();
        return json;
    }

    async post(path, data) {
        const response = await fetch(`${this.baseURL}/${path}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        const json = await response.json();
        return json;
    }

    async register(username, password) {
        const response = await this.post('register', { username, password });
        this.token = response.code;
        return response;
    }

    async authenticate(username, password) {
        const response = await this.post('auth', { username, password });
        this.token = response.code;
        return response;
    }

    async updatePassword(password) {
        const response = await this.post('updatePassword', { password });
        return response;
    }

    async createChat(name) {
        const response = await this.post('createChat', { name });
        return response;
    }

    async createChatMessage(chatId, content) {
        const response = await this.post('createChatMessage', { chatId, content });
        return response;
    }

    async getChatMessages(chatId) {
        const response = await this.post('getChatMessages', { chatId });
        return response;
    }

    async getInvolvedChats() {
        const response = await this.post('getInvolvedChats');
        return response;
    }

    async getChatUsers(chatId) {
        const response = await this.post('getChatUsers', { chatId });
        return response;
    }

    async healthCheck() {
        const response = await this.get('healthcheck');
        return response;
    }
}
