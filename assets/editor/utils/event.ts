/**
 * @zh Gizmo 使用的事件对象，主要用于扩展定义
 * @en Gizmo event object, used to extend definitions
 *   https://github.com/itharbors/structures/blob/main/source/lib/event.ts
 */

interface HandleItem {
    handle: Function;
    once: boolean;
}

export interface EventTable {
    [action: string]: {
        params: any[];
        result: any;
    };
}

export class EventEmitter<T extends EventTable = EventTable> {

    _events: { [action: string]: HandleItem[] } = {};

    /**
     * @zh 监听一个事件
     * @en Listen to an event
     * @param action 
     * @param handle 
     */
    addListener<A extends keyof T>(action: A, handle: (...args: T[A]['params']) => T[A]['result']) {
        const HandleArray = this._events[action as string] = this._events[action as string] || [];

        if (HandleArray.find(item => item.handle === handle)) {
            return console.error(`Please do not listen to the same function repeatedly.`);
        }

        HandleArray.push({
            handle,
            once: false,
        });
    }

    /**
     * @zh 监听一个事件，触发后立即删除
     * @en Listen to an event, triggered once
     * @param action 
     * @param handle 
     */
    addOnceListener<A extends keyof T>(action: A, handle: (...args: T[A]['params']) => T[A]['result']) {
        const HandleArray = this._events[action as string] = this._events[action as string] || [];

        if (HandleArray.find(item => item.handle === handle)) {
            return console.error(`Please do not listen to the same function repeatedly.`);
        }

        HandleArray.push({
            handle,
            once: true,
        });
    }

    /**
     * @zh 取消一个事件监听
     * @en Cancel a event listener
     * @param action 
     * @param handle 
     */
    removeListener<A extends keyof T>(action: A, handle: (...args: T[A]['params']) => T[A]['result']) {
        if (!handle) {
            if (this._events[action as string]) {
                this._events[action as string].length === 0;
                delete this._events[action as string];
            }
            return;
        }

        const HandleArray = this._events[action as string] = this._events[action as string] || [];

        for (let i = 0; i < HandleArray.length; i++) {
            const Item = HandleArray[i];
            if (Item.handle === handle) {
                HandleArray.splice(i, 1);
                break;
            }
        }
    }

    /**
     * @zh 清空事件监听
     * @en Clear all event listeners
     * @param action 
     */
    clear<A extends keyof T>(action?: A) {
        if (action) {
            if (this._events[action as string]) {
                this._events[action as string].length === 0;
                delete this._events[action as string];
            }
            return;
        }
        Object.keys(this._events).forEach((name) => {
            this._events[name].length === 0;
            delete this._events[name];
        });
    }

    /**
     * @zh 触发一个事件
     * @en Trigger an event
     * @param action 
     * @param args 
     */
    async emit<A extends keyof T>(action: A, ...args: T[A]['params']) {
        if (!this._events[action as string]) {
            return;
        }
        const HandleArray = this._events[action as string];

        for (let i = 0; i < HandleArray.length; i++) {
            const HandleItem =  HandleArray[i];
            if (HandleItem.once) {
                HandleArray.splice(i, 1);
                i--;
            }

            try {
                await HandleItem.handle.call(this, ...args);
            } catch(error) {
                console.error(error);
            }
        }
    }
}