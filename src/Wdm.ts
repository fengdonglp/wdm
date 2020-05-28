import { TMOptions, TaskManager } from "./TaskManager";

class Wdm {
  taskManager: TaskManager;

  constructor() {
    this.taskManager = new TaskManager();
  }

  add(options: TMOptions) {
    // 将下载任务添加到任务列表中，并且弹窗提示：由于导出数据量过大，导出任务在后台执行，请在右下角查看导出是否完成
    // 添加导出完成后弹窗提示用户数据导出完成，请点击下载
    // 应该先比较任务是否已经存在，如果存在则提示，导出任务正在执行，请等待
    const task = this.taskManager.add(options, true);
  }

  // 创建信息窗体
  createInfowindow() {
    // 可以简单封装一些常用的dom操作，可从vue源码中直接拷贝，将dom绑定到下载列表对象上，方便dom操作
  }

  showInfowindow() {

  }

  hideInfowindow() {

  }

  // 添加下载列表
  addDownloadList(data) {
    // 生成dom list 添加到信息窗体中
    // 涉及到原生dom的各种操作
    // 直接用template生成对应的内容
  }

  // 删除下载列表
  deleteDownloadList(data) {

  }

  // 清空下载列表
  clear() {

  }

  // 销毁实例及dom
  destroy() {

  }
}

// 窗口通信集成一个简版的iframe通信模块