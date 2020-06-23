import './style/wdm.css';
import md5 from 'blueimp-md5';
import TaskManager, { TMOptions } from './TaskManager';
import { Task } from './Tasks';
import EventEmitter from './EventEmitter';
import { downloadURL, addClass, removeClass, createDownloadFn } from './utils';

// 任务过期时间
const expiredTime = 3 * 24 * 60 * 60 * 1000;

function isExpired(data: Metadata): boolean {
  return Date.now() - data.createTime >= data.expired;
}

interface DownloadListOption {
  name: string, // 下载文件名
}

type DomReturn = {
  el: HTMLElement,
  changeState: (elState: number, url: string) => void,
  toggleLight: (light: boolean) => void
} | undefined;

interface DownloadDomOption {
  title?: string,
  list?: Array<DownloadListOption>,
  width?: string,
  position?: {
    top?: number,
    left?: number,
    right?: number,
    bottom?: number,
  },
  collapse?: boolean,
  container?: HTMLElement,
  deleteListWhenDownload?: boolean
}

class DownloadDom extends EventEmitter {
  el: HTMLElement | null = null;

  listEl: HTMLElement | null = null;

  emptyDom: HTMLElement | null = null;

  isEmpty = true;

  // 任务存储到内存中，每次启动后从内存中读取数据，恢复任务
  // 存在一种情况就是任务仍然存在在内存中
  // 设置选项，如果已经下载，点击下载按钮后是否删除该任务，还是与后端协商任务保存时效
  // 第一版暂定为点击下载后即任务取消，不在保存

  constructor(public options: DownloadDomOption) {
    super();
    this.createContainerDom();
  }

  createContainerDom(): void {
    this.el = document.createElement('div');
    this.el.className = 'wdm-container min';
    this.el.innerHTML = `
      <div class="wdm-box" style="width: ${this.options.width || 'initial'}; display: none">
        <header class="wdm-title">
          <div class="wdm-minimize" title="最小化">
            <span class="wdm-minimize__btn"></span>
          </div>
          <div class="wdm-title__text">${this.options.title || '下载列表'}</div>
        </header>
        <div class="wdm-content">
          <ul class="wdm-list">
            <li class="wdm-list-item empty-list" style="text-align:center;">空</li>
          </ul>
        </div>
      </div>
      <div class="wdm-collapse" title="点击展开下载列表">
        <div class="wdm-collapse-btn"></div>
      </div>
    `;

    const container = this.options.container || document.body;
    container.appendChild(this.el);
    this.emptyDom = this.el.querySelector('.empty-list');
    this.addEvent();
  }

  hideEmptyList(): void {
    if (!this.emptyDom) return;
    this.emptyDom.style.display = 'none';
    this.isEmpty = false;
  }

  showEmptyList(): void {
    if (!this.emptyDom) return;
    this.emptyDom.style.display = 'block';
    this.isEmpty = true;
  }

  addEvent(): void {
    if (!this.el) return;
    const minBtn = this.el.querySelector('.wdm-minimize');
    const collapseBtn = this.el.querySelector('.wdm-collapse');
    const box = this.el.querySelector('.wdm-box');

    this.listEl = this.el.querySelector('.wdm-list');
    let minin = false;

    if (minBtn && box) {
      minBtn.addEventListener('click', () => {
        if (!this.el) return;
        addClass(this.el, 'min');
        minin = true;
      });

      box.addEventListener('animationend', () => {
        if (!this.el) return;
        (box as HTMLElement).style.display = minin ? 'none' : 'block';
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        if (!this.el) return;
        (box as HTMLElement).style.display = 'block';
        removeClass(this.el, 'min');
        minin = false;
      });
    }
  }

  add(options: {
    ctx: DownloadItem,
    name: string,
    state: number,
    downloadUrl?: string
  }): DomReturn {
    const {
      ctx,
      name,
      state,
      downloadUrl
    } = options;
    if (!this.listEl || state === 3) return;

    if (this.isEmpty) {
      this.hideEmptyList();
    }

    const listItemDom = document.createElement('li');
    listItemDom.className = 'wdm-list-item';
    listItemDom.innerHTML = `
      <div class="wdm-download-state">
        <div class="wdm-download__loading" style="display: ${state === 1 ? 'inline-block' : 'none'}"></div>
        <a href="#" data-download="${name}" data-url="${downloadUrl}" class="wdm-download__btn" style="display: ${state === 2 ? 'inline' : 'none'}">下载</a>
      </div>
      <div class="wdm-filename" title="${name}">${name}</div>
    `;

    const listContainer = this.listEl;
    listContainer.appendChild(listItemDom);

    const changeState = (elState: number, url = ''): void => {
      const downloadEl = listItemDom.querySelector('.wdm-download__btn');
      const loadingEl = listItemDom.querySelector('.wdm-download__loading');
      if (!downloadEl || !downloadEl) return;

      if (elState === 2) {
        (downloadEl as HTMLElement).style.display = 'inline';
        (loadingEl as HTMLElement).style.display = 'none';
        downloadEl.setAttribute('data-url', url);
        return;
      }

      if (elState === 1) {
        (downloadEl as HTMLElement).style.display = 'none';
        (loadingEl as HTMLElement).style.display = 'inline-block';
        return;
      }

      if (elState === 3) {
        (listItemDom.parentElement as HTMLElement).removeChild(listItemDom);
        const list = listContainer.querySelectorAll('.wdm-list-item');
        
        if (list.length <= 1) {
          this.showEmptyList();
        }
      }
    }

    // 添加下载按钮点击事件
    const downloadBtn = listItemDom.querySelector('.wdm-download__btn');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isExpired(ctx.metadata)) {
          this.emit('download_expired', ctx);
        } else {
          this.emit('download_click', ctx);
          const url = downloadBtn.getAttribute('data-url');
          if (!url) {
            this.emit('download_error', ctx);
          } else {
            downloadURL(url);
          }
        }

        if (this.options.deleteListWhenDownload) {
          changeState(3);
        }
      });
    }

    const domReturn = {
      el: listItemDom,
      changeState,
      toggleLight(light = true): void {
        // eslint-disable-next-line no-unused-expressions
        light ? addClass(listItemDom, 'light') : removeClass(listItemDom, 'light');
      }
    }

    // eslint-disable-next-line consistent-return
    return domReturn;
  }

  clear(): void {
    if (this.el && this.listEl) {
      this.emptyDom = null;
      this.listEl.innerHTML = '<li class="wdm-list-item empty-list" style="text-align:center;">空</li>';
      this.emptyDom = this.el.querySelector('.empty-list');
      this.showEmptyList();
    }
  }

  expand(): void {
    if (!this.el) return;
    const collapseBtn = this.el.querySelector('.wdm-collapse');
    if (collapseBtn) {
      (collapseBtn as HTMLElement).click();
    }
  }

  collapse(): void {
    if (!this.el) return;
    const minBtn = this.el.querySelector('.wdm-minimize');
    if (minBtn) {
      (minBtn as HTMLElement).click();
    }
  }
}

interface DownloadTaskOption {
  name: string,
  interval?: number,
  expired?: number,
  request: (next: Function, end: Function) => any | object // 如果下载任务未跨iframe，在同一个页面则可以直接将下载任务扔进去，如果不是则需要将请求相关数据扔进来
}

type Metadata = {
  name: string,
  createTime: number,
  expired: number,
  $option: DownloadTaskOption
};

interface DownloadItem {
  task: Task | {id: number | string},
  dom: DomReturn | undefined,
  metadata: Metadata
}

// 迅速实现一个简版，支持当前页面管理的任务队列即可
export default class Wdm extends EventEmitter {
  collector: Map<string, DownloadItem> = new Map();

  taskManager: TaskManager = new TaskManager();

  el: DownloadDom;

  storeKeyName = `wdm_download_list_${  md5(window.location.href)}`;

  constructor(public options: {width?: string, deleteListWhenDownload: true}) {
    super();

    this.el = new DownloadDom({
      width: this.options.width,
      deleteListWhenDownload: this.options.deleteListWhenDownload
    });

    this.el.on('download_click', (collectorItem: DownloadItem) => {
      this.emit('download_click', collectorItem);
      if (this.options.deleteListWhenDownload) {
        this.delete(collectorItem.task.id.toString());
      }
    });
    
    this.el.on('download_expired', (collectorItem: DownloadItem) => {
      this.emit('download_expired', collectorItem);
      this.delete(collectorItem.task.id.toString());
    });

    this.initListFromStorage();
  }

  initListFromStorage(): void {
    let hasExpired = false;
    const store = this.getAllList();
    for (let index = 0; index < store.length; index++) {
      const item = store[index];
      if (isExpired(item) || typeof item.$option.request === 'function') {
        hasExpired = true;
        store.splice(index, 1);
        index--;
      } else {
        this.add(item, true);
      }
    }

    if (hasExpired) {
      localStorage.setItem(this.storeKeyName, JSON.stringify(store));
    }
  }

  storeList(data: Metadata): void {
    const store = this.getAllList();
    store.push(data);
    localStorage.setItem(this.storeKeyName, JSON.stringify(store));
  }

  getAllList(): Array<Metadata> {
    const storage = localStorage.getItem(this.storeKeyName);
    if (storage) {
      return JSON.parse(storage);
    }
    return [];
  }

  // 添加不包含请求的下载列表，列表从后台获取
  addNoRequestList(list: Array<any>, update: boolean): void {
    if (update) {
      this.el.clear();
      this.collector.clear();
    }
    list.forEach((item, index) => {
      const metadata: Metadata = {
        name: item.name,
        createTime: Date.now(),
        expired: item.expired || expiredTime,
        $option: item,
      }
      const collectorItem: DownloadItem = {
        dom: undefined,
        task: {
          id: index
        },
        metadata
      };
  
      const dom = this.el.add({
        ctx: collectorItem,
        name: item.name,
        state: item.state === undefined ? 1 : item.state,
        downloadUrl: item.downloadUrl
      });
  
      collectorItem.dom = dom;
  
      this.collector.set(index.toString(), collectorItem);
    })
  }

  add(metaOption: DownloadTaskOption | Metadata, isStore = false): boolean {
    const option = isStore ? (metaOption as Metadata).$option : (metaOption as DownloadTaskOption);
    const options: TMOptions = {
      type: 2,
      immediate: true,
      metadata: option.name,
      interval: option.interval,
      fn: () => {}
    }
    if (typeof option.request === 'function') {
      options.fn = option.request;
    } else {
      options.fn = createDownloadFn(option.request);
      options.metadata = option.request;
    }

    options.callback = [this.downloadEnd.bind(this)];
    
    const { succeed, task } = this.taskManager.add(options);
    
    // 清空当前正在高亮的下载任务
    this.resetListLight();
    
    if (succeed) {
      const metadata: Metadata = isStore ? (metaOption as Metadata) : {
        name: option.name,
        createTime: Date.now(),
        expired: option.expired || expiredTime,
        $option: option,
      }
      const collectorItem: DownloadItem = {
        dom: undefined,
        task,
        metadata
      };

      const dom = this.el.add({
        ctx: collectorItem,
        name: option.name,
        state: 1
      });

      collectorItem.dom = dom;

      if (!isStore) {
        this.storeList(metadata);
      }

      this.collector.set(task.id, collectorItem);

      return true;
    } 

    const item = this.collector.get(task.id);
    if (item && item.dom) {
      item.dom.toggleLight(true);
    }
    return false;
  }

  resetListLight(): void {
    this.collector.forEach(clt => {
      if (clt.dom) {
        clt.dom.toggleLight(false);
      }
    });
  }

  downloadEnd(ctx: Task, data?: any): void {
    const dItem = this.collector.get(ctx.id);
    if (dItem && dItem.dom) {
      dItem.dom.changeState(data.state, data.exportUrl);
    }
    this.emit('request_end', ctx);
  }

  collapse(): void {
    this.el.collapse();
  }

  expand(): void {
    this.el.expand();
  }

  delete(id: string): void {
    this.collector.delete(id);
  }

  clear(): void {
    this.collector.clear();
  }
}