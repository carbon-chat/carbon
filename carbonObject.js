class CarbonObject {
    constructor(type, data) {
        this.type = type;

        Object.assign(this, data);
    }
}

module.exports = CarbonObject;
