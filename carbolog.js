const fs = require('fs');

class Logger {
    constructor(logDirectory) {
        this.logs = [];
        this.logDirectory = logDirectory;
    }

    updateLog() {
        if (this.logs.length == 0) {
            return;
        }

        const today = new Date();
        const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const logPath = `${this.logDirectory}/${date}.log`;

        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory);
        }

        fs.writeFileSync(logPath, '', 'utf-8');

        for (const log of this.logs) {
            fs.appendFileSync(logPath, `${log.type} :: ${log.timestamp} :: ${log.message}\n\n`, 'utf-8');
        }
    }

    baseMessage(message, type) {
        this.logs.push({ message, timestamp: Date().toString(), type });
        this.updateLog();
    }

    info(message) {
        this.baseMessage(message, 'info');
    }

    verbose(message) {
        this.baseMessage(message, 'verbose');
    }

    debug(message) {
        this.baseMessage(message, 'debug');
    }

    warn(message) {
        this.baseMessage(message, 'warn');
    }

    error(message) {
        this.baseMessage(message, 'error');
    }
}

module.exports = Logger;
