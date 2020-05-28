import { objectHasOwnProperty } from './utils';

/**
 * @description 发布订阅中心
 * @export
 * @class EventEmitter
 */
export default class EventEmitter {
  events: {
    [type: string]: Array<Function>
  };

  constructor () {
    this.events = {}
  }

  on (type: string, callback: Function): void {
    if (objectHasOwnProperty(this.events, type)) {
      this.events[type].push(callback)
    } else {
      this.events[type] = [callback]
    }
  }

  off (type: string, callback?: Function): void {
    if (objectHasOwnProperty(this.events, type)) {
      if (callback && typeof callback === 'function') {
        this.events[type].forEach((item, index) => {
          if (item === callback) {
            this.events[type].splice(index, 1)
          }
        })
        return
      }
      delete this.events[type]
    }
  }

  clear (): void {
    Object.keys(this.events).forEach(key => {
      this.off(key);
    })
  }

  emit (type: string, ...args: any[]): void {
    if (objectHasOwnProperty(this.events, type)) {
      this.events[type].forEach((fn) => {
        fn.apply(this, args)
      })
    }
  }
}
