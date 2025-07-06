const api = require('../../utils/api');
Page({
  data: {
    isRunning: false,
    loading: false,
    params: {
      temp: 50,
      tempQuick: [45, 50, 55],
      distance: 3,
      time: 15,
      timeOptions: [5, 10, 15, 20, 25, 30],
      method: '温和灸',
      methodOptions: ['回旋灸', '雀啄灸', '温和灸'],
      smokeClean: '三级',
      smokeCleanOptions: ['关闭', '一级', '二级', '三级'],
      tempProtect: true,
      material: '艾条',
      materialOptions: ['艾绒', '艾条']
    },
    timeIndex: 2,
    status: 'idle', // 'idle' | 'running' | 'paused'
    runningTime: '00:00',
    remainingTime: '30:00',
    totalTime: 30 * 60, // 30分钟
    timer: null,
    startTime: null,
    elapsed: 0
  },

  onLoad() {
    this.loadSettings();
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  onShow() {
    this.loadSettings();
    this.checkRunningStatus();
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('moxibustionSettings');
    if (settings) {
      this.setData({
        ...settings,
        isRunning: wx.getStorageSync('moxibustionRunning') || false
      });
    }
  },

  // 保存设置
  saveSettings() {
    const settings = {
      temp: this.data.params.temp,
      distance: this.data.params.distance,
      time: this.data.params.time,
      method: this.data.params.method,
      smokeClean: this.data.params.smokeClean,
      tempProtect: this.data.params.tempProtect,
      material: this.data.params.material
    };
    wx.setStorageSync('moxibustionSettings', settings);
  },

  // 温度滑块
  onTempChange(e) {
    this.setData({ 'params.temp': Number(e.detail.value) });
  },
  // 温度快捷按钮
  onQuickTemp(e) {
    this.setData({ 'params.temp': Number(e.currentTarget.dataset.value) });
  },
  // 灸距滑块
  onDistanceChange(e) {
    this.setData({ 'params.distance': Number(e.detail.value) });
  },
  // 时间选择
  onTimeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.time': this.data.params.timeOptions[idx],
      timeIndex: idx
    });
  },
  // 灸法选择
  onMethodChange(e) {
    this.setData({ 'params.method': e.detail.value });
  },
  // 烟雾净化
  onSmokeCleanChange(e) {
    this.setData({ 'params.smokeClean': e.detail.value });
  },
  // 温度保护
  onTempProtectChange(e) {
    this.setData({ 'params.tempProtect': e.detail.value });
  },
  // 灸材选择
  onMaterialChange(e) {
    this.setData({ 'params.material': e.detail.value });
  },
  // 启动艾灸
  onStart() {
    // 检查模式互斥
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key && currentTherapyMode.key !== 'moxibustion') {
      wx.showModal({
        title: '模式冲突',
        content: `当前正在运行${currentTherapyMode.name}，请先停止当前模式后再启动艾灸`,
        confirmText: '确定',
        showCancel: false
      });
      return;
    }

    const duration = this.data.params.time || 30;
    this.setData({
      isRunning: true,
      status: 'running',
      startTime: Date.now(),
      runningTime: '00:00',
      remainingTime: this.formatTime(duration * 60),
      elapsed: 0
    });
    this.startTimer(duration * 60);
    wx.setStorageSync('moxibustionRunning', true);
    
    // 保存当前运行模式
    wx.setStorageSync('currentTherapyMode', {
      key: 'moxibustion',
      name: '艾灸理疗',
      startTime: new Date().toISOString()
    });
    
    wx.showToast({ title: '艾灸已启动', icon: 'success' });
  },
  // 暂停
  onPause() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    this.setData({ status: 'paused' });
    wx.showToast({ title: '已暂停', icon: 'none' });
  },
  // 继续
  onResume() {
    const duration = this.data.params.time || 30;
    this.setData({
      status: 'running',
      startTime: Date.now() - this.data.elapsed * 1000
    });
    this.startTimer(duration * 60 - this.data.elapsed);
    wx.showToast({ title: '继续艾灸', icon: 'success' });
  },
  // 结束
  onStop() {
    if (this.data.timer) clearInterval(this.data.timer);
    this.setData({
      isRunning: false,
      status: 'idle',
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.params.time * 60 || 1800),
      elapsed: 0
    });
    wx.setStorageSync('moxibustionRunning', false);
    
    // 清除当前运行模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({ title: '艾灸已结束', icon: 'none' });
  },
  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route !== 'pages/index/index') {
      wx.navigateBack();
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },
  startMoxibustion() {
    api.controlMoxibustion({
      action: 'start',
      temp: this.data.params.temp,
      time: this.data.params.time,
      part: this.data.part,
      intensity: this.data.intensity,
      mode: this.data.mode
    }).then(() => {
      this.setData({ status: '运行中' });
    });
  },
  stopMoxibustion() {
    api.controlMoxibustion({ action: 'stop' }).then(() => {
      this.setData({ status: '已停止' });
    });
  },
  startTimer(totalSeconds) {
    if (this.data.timer) clearInterval(this.data.timer);
    this.data.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.data.startTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      this.setData({
        runningTime: this.formatTime(elapsed),
        remainingTime: this.formatTime(remaining),
        elapsed
      });
      if (remaining <= 0) {
        this.onStop();
      }
    }, 1000);
  },
  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },
  parseTime(str) {
    const [m, s] = str.split(':').map(Number);
    return m * 60 + s;
  },
  onToggle() {
    if (this.data.loading) return;
    if (!this.data.isRunning) {
      this.onStart();
    } else if (this.data.isRunning && this.data.status !== 'paused') {
      this.onPause();
    } else if (this.data.status === 'paused') {
      this.onResume();
    }
  },

  // 检查运行状态
  checkRunningStatus() {
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key === 'moxibustion') {
      // 如果当前运行的是艾灸，恢复运行状态
      this.setData({
        isRunning: true,
        status: 'running'
      });
    } else if (currentTherapyMode && currentTherapyMode.key !== 'moxibustion') {
      // 如果运行的是其他模式，禁用启动按钮
      this.setData({
        isRunning: false,
        status: 'idle'
      });
    }
  }
}); 