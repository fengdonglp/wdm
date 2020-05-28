/**
 * @description 是否是纯对象
 * @export
 * @param {*} val
 * @returns {boolean}
 */
export function isObject(val: any): boolean {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

/**
 * @description 首字母大写
 * @export
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str: string): string {
  if (str.length === 0) {
    return '';
  }

  return str.substr(0, 1).toUpperCase() + str.substr(1);
}

/**
 * @description 对象自身是否包含某个属性
 * @export
 * @param {object} obj
 * @param {string} key
 * @returns {boolean}
 */
export function objectHasOwnProperty (obj: object, key?: string): boolean {
  if (!key) return false;
  return Object.hasOwnProperty.call(obj, key);
}

/**
 * @description 获取一个对象的多层次属性，例如 getDeepProperty(obj, 'key1.key2.key3') -> obj.key1.key2.key3
 * @export
 * @param {object} obj
 * @param {string} prop
 * @returns
 */
export function getDeepProperty(obj: object, prop: string): any {
  if (!isObject(obj)) return undefined;

  const keys = prop.split('.');
  let value: any = obj;
  keys.forEach(key => {
    value = value[key];
  });

  return value;
}

export function downloadURL(_url: string):void {
  try {
    const elemIF = document.createElement('iframe');
    elemIF.src = _url;
    elemIF.style.display = 'none';
    document.body.appendChild(elemIF);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

export function addClass(dom: HTMLElement, classname: string): boolean {
  const classes = dom.className.split(' ');
  if (classes.includes(classname)) {
    return false;
  }
  classes.push(classname);
  // eslint-disable-next-line no-param-reassign
  dom.className = classes.join(' ');
  return true;
}

export function removeClass(dom: HTMLElement, classname: string): void {
  const classes = dom.className.split(' ');
  const index = classes.indexOf(classname);
  if (index !== -1) {
    classes.splice(index, 1);
    // eslint-disable-next-line no-param-reassign
    dom.className = classes.join(' ');
  }
}

interface Request {
  url: string,
  data?: object,
  type: 'get' | 'post' | 'GET' | 'POST',
  contentType?: string,
  successKey: string,
  endKey: string,
  endValue: string | number | Array<any> | boolean,
  successValue: any,
  resultKey: string
}

// 生成下载任务函数
export function createDownloadFn({
  url,
  type,
  contentType = 'application/json;charset=utf-8',
  data,
  endKey,
  endValue,
  resultKey
}: Request): (next: Function, end: Function) => any {
  return function request(next: Function, end: Function): void {
    const ajax = new XMLHttpRequest();
    ajax.open(type, url);
    ajax.setRequestHeader('Content-Type', contentType);
    ajax.onreadystatechange = function onReadStateChange(): void {
      if (ajax.readyState === 4 && ajax.status === 200) {
        const result = JSON.parse(ajax.responseText);
        const endV = getDeepProperty(result, endKey);
        
        let flag = false;
        if (Array.isArray(endValue)) {
          flag = endValue.indexOf(endV) !== -1
        }
        
        if (flag || endV === endValue) {
          end(getDeepProperty(result, resultKey));
        } else {
          next();
        }
      }
    }
    ajax.send(data ? JSON.stringify(data) : null);
  }
}