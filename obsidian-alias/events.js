/** @type {import('events')} */
// Since this is not a Node.js environment, we need to implement a basic EventEmitter
class EventEmitter {
    constructor() {
        this._events = {};
        this._maxListeners = 10;
    }

    on(type, listener) {
        if (!this._events[type]) {
            this._events[type] = [];
        }
        this._events[type].push(listener);
        return this;
    }

    emit(type, ...args) {
        if (!this._events[type]) return false;
        
        const listeners = this._events[type].slice();
        for (const listener of listeners) {
            listener.apply(this, args);
        }
        return true;
    }

    removeListener(type, listener) {
        if (!this._events[type]) return this;
        
        const index = this._events[type].indexOf(listener);
        if (index !== -1) {
            this._events[type].splice(index, 1);
        }
        return this;
    }

    once(type, listener) {
        const onceWrapper = (...args) => {
            this.removeListener(type, onceWrapper);
            listener.apply(this, args);
        };
        return this.on(type, onceWrapper);
    }

    removeAllListeners(type) {
        if (type) {
            this._events[type] = [];
        } else {
            this._events = {};
        }
        return this;
    }

    setMaxListeners(n) {
        this._maxListeners = n;
        return this;
    }

    getMaxListeners() {
        return this._maxListeners;
    }

    listenerCount(type) {
        return this._events[type] ? this._events[type].length : 0;
    }
}

const events = {
    EventEmitter,
    
    // Add isUsingObsidian flag like other modules
    isUsingObsidian: true
};

module.exports = events;
