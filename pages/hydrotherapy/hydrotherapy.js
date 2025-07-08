const api = require('../../utils/api');

Page({
  data: {
    isRunning: false,
    status: '未启动',
    temp: 40,
    pressure: '中',
    pressureOptions: ['低', '中', '高'],
    massageMode: '脉冲',
    massageOptions: ['脉冲', '气泡', '波浪'],
    timer: 20,
    timerOptions: [10, 20, 30, 40, 50, 60],
    preset: '放松',
    presetOptions: ['放松', '活力', '恢复'],
    loading: false,
    deviceConnected: false, // 设备连接状态
    deviceStatus: '未知', // 设备状态
    params: {
      waterTemp: 38,
      waterTempQuick: [35, 38, 42],
      waterPressure: '标准',
      massageModes: ['脉冲'],
      duration: 30,
      focusAreas: [],
      frequency: 40,
      intensity: 0.5,
      therapyTime: 15,
      therapyMode: '脉冲',
      flowMassage: '标准',
      bubbleAmount: 50
    },
    waterPressureOptions: ['轻柔', '标准', '强力'],
    massageModeOptions: ['脉冲', '气泡', '波浪', '组合'],
    durationOptions: [10, 15, 20, 30, 45, 60],
    focusAreaOptions: ['背部', '腰部', '腿部', '足部'],
    showAdvanced: false,
    therapyTimeOptions: [5, 10, 15, 20, 25, 30],
    therapyModeOptions: ['连续', '脉冲'],
    flowMassageOptions: ['关闭', '轻柔', '标准', '强力'],
    durationIndex: 3,
    therapyTimeIndex: 2,
    therapyStatus: 'idle', // 'idle' | 'running' | 'paused'
    runningTime: '00:00',
    remainingTime: '30:00',
    startTime: null,
    elapsed: 0,
    isPaused: false, // 新增，标记是否暂停
  },

  onLoad(options) {
    console.log('水疗页面加载', options);
    this.loadSettings();
    this.initPage();
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  onShow() {
    console.log('水疗页面显示');
    this.loadSettings();
    this.checkRunningStatus();
    this.restoreRunningState && this.restoreRunningState();
    // 实时刷新运行时间
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    const isRunning = wx.getStorageSync('hydrotherapyRunning') || false;
    const status = this.data.therapyStatus || 'idle';
    if (currentTherapyMode && currentTherapyMode.key === 'hydrotherapy' && isRunning && status === 'running') {
      const startTime = new Date(currentTherapyMode.startTime).getTime();
      const totalSeconds = (this.data.params.duration || 30) * 60;
      this.setData({ startTime });
      this.startTimer(totalSeconds);
    }
  },

  onReady() {
    console.log('水疗页面就绪');
  },

  onHide() {
    console.log('水疗页面隐藏');
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('hydrotherapySettings');
    if (settings) {
      this.setData({
        ...settings,
        isRunning: wx.getStorageSync('hydrotherapyRunning') || false
      });
    }
  },

  // 保存设置
  saveSettings() {
    const settings = {
      temp: this.data.temp,
      pressure: this.data.pressure,
      massageMode: this.data.massageMode,
      timer: this.data.timer,
      preset: this.data.preset,
      params: this.data.params
    };
    wx.setStorageSync('hydrotherapySettings', settings);
  },

  // 检查运行状态
  checkRunningStatus() {
    // 检查设备状态
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const hasConnectedDevice = historyDevices.some(device => device.connected);
    
    this.setData({
      deviceConnected: hasConnectedDevice,
      deviceStatus: hasConnectedDevice ? (deviceRunning ? '运行中' : '已连接') : '未连接'
    });

    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key === 'hydrotherapy') {
      // 如果当前运行的是水疗，恢复运行状态
      this.setData({
        isRunning: true,
        therapyStatus: 'running'
      });
    } else if (currentTherapyMode && currentTherapyMode.key !== 'hydrotherapy') {
      // 如果运行的是其他模式，禁用启动按钮
      this.setData({
        isRunning: false,
        therapyStatus: 'idle'
      });
    }
  },
  onTempChange(e) {
    try {
      this.setData({ temp: e.detail.value });
    } catch (error) {
      console.error('温度设置失败:', error);
    }
  },

  onPressureChange(e) {
    try {
      this.setData({ pressure: this.data.pressureOptions[e.detail.value] });
    } catch (error) {
      console.error('水压设置失败:', error);
    }
  },

  onMassageChange(e) {
    try {
      this.setData({ massageMode: this.data.massageOptions[e.detail.value] });
    } catch (error) {
      console.error('按摩模式设置失败:', error);
    }
  },

  onTimerChange(e) {
    try {
      this.setData({ timer: this.data.timerOptions[e.detail.value] });
    } catch (error) {
      console.error('定时设置失败:', error);
    }
  },

  onPresetChange(e) {
    try {
      this.setData({ preset: this.data.presetOptions[e.detail.value] });
    } catch (error) {
      console.error('预设程序设置失败:', error);
    }
  },
  onBack() {
    try {
      const pages = getCurrentPages();
      if (pages.length > 1 && pages[pages.length - 2].route !== 'pages/index/index') {
        wx.navigateBack();
      } else {
        wx.reLaunch({ url: '/pages/index/index' });
      }
    } catch (error) {
      console.error('返回操作失败:', error);
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },
  onToggle() {
    if (this.data.loading) return;
    
    // 检查设备连接状态
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const hasConnectedDevice = historyDevices.some(device => device.connected);
    
    if (!hasConnectedDevice) {
      wx.showModal({
        title: '设备未连接',
        content: '请先连接设备后再启动水疗',
        confirmText: '去连接',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/appconnect/appconnect' });
          }
        }
      });
      return;
    }

    if (!deviceRunning) {
      wx.showModal({
        title: '设备未启动',
        content: '请先启动设备后再启动水疗',
        confirmText: '去启动',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/appconnect/appconnect' });
          }
        }
      });
      return;
    }

    if (!this.data.isRunning) {
      this.onStart();
    } else if (this.data.isRunning && !this.data.isPaused) {
      this.onPause();
    } else if (this.data.isPaused) {
      this.onResume();
    }
  },
  onStart() {
    this.setData({ loading: true });

    // 检查模式互斥
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key && currentTherapyMode.key !== 'hydrotherapy') {
      wx.showModal({
        title: '模式冲突',
        content: `当前正在运行${currentTherapyMode.name}，请先停止当前模式后再启动水疗`,
        confirmText: '确定',
        showCancel: false,
        success: () => {
          this.setData({ loading: false });
        }
      });
      return;
    }

    const duration = this.data.params.duration || 30;
    this.setData({
      isRunning: true,
      isPaused: false,
      therapyStatus: 'running',
      startTime: Date.now(),
      runningTime: '00:00',
      remainingTime: this.formatTime(duration * 60),
      elapsed: 0,
      loading: false
    });
    
    this.startTimer(duration * 60);
    wx.setStorageSync('hydrotherapyRunning', true);
    
    // 保存当前运行模式
    wx.setStorageSync('currentTherapyMode', {
      key: 'hydrotherapy',
      name: '超音波水疗',
      startTime: new Date().toISOString()
    });
    
    wx.showToast({ title: '水疗已启动', icon: 'success' });
  },
  onPause() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    this.setData({
      therapyStatus: 'paused',
      isPaused: true
    });
    wx.showToast({ title: '已暂停', icon: 'none' });
  },
  onResume() {
    const duration = this.data.params.duration || 30;
    this.setData({
      therapyStatus: 'running',
      isPaused: false,
      startTime: Date.now() - this.data.elapsed * 1000
    });
    this.startTimer(duration * 60 - this.data.elapsed);
    wx.showToast({ title: '继续水疗', icon: 'success' });
  },
  onStop() {
    this.setData({ loading: true });

    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    this.setData({
      isRunning: false,
      isPaused: false,
      therapyStatus: 'idle',
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.params.duration * 60 || 1800),
      elapsed: 0,
      loading: false
    });
    
    wx.setStorageSync('hydrotherapyRunning', false);
    
    // 清除当前运行模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({ title: '水疗已结束', icon: 'none' });
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
  // 水温滑块
  onWaterTempChange(e) {
    this.setData({ 'params.waterTemp': Number(e.detail.value) });
  },
  // 水温快捷按钮
  onQuickTemp(e) {
    this.setData({ 'params.waterTemp': Number(e.currentTarget.dataset.value) });
  },
  // 水压强度
  onWaterPressureChange(e) {
    this.setData({ 'params.waterPressure': e.detail.value });
  },
  // 按摩模式
  onMassageModeChange(e) {
    this.setData({ 'params.massageMode': e.detail.value });
  },
  // 持续时间
  onDurationChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.duration': this.data.durationOptions[idx],
      durationIndex: idx
    });
  },
  // 重点部位
  onFocusAreasChange(e) {
    this.setData({ 'params.focusAreas': e.detail.value });
  },
  // 频率
  onFrequencyChange(e) {
    this.setData({ 'params.frequency': Number(e.detail.value) });
  },
  // 强度
  onIntensityChange(e) {
    this.setData({ 'params.intensity': Number(e.detail.value) });
  },
  // 治疗时间
  onTherapyTimeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.therapyTime': this.data.therapyTimeOptions[idx],
      therapyTimeIndex: idx
    });
  },
  // 超声模式
  onTherapyModeChange(e) {
    this.setData({ 'params.therapyMode': e.detail.value });
  },
  // 水流按摩
  onFlowMassageChange(e) {
    this.setData({ 'params.flowMassage': e.detail.value });
  },
  // 气泡量
  onBubbleAmountChange(e) {
    this.setData({ 'params.bubbleAmount': Number(e.detail.value) });
  },
  // 折叠/展开专业参数
  toggleAdvanced() {
    this.setData({ showAdvanced: !this.data.showAdvanced });
  }
}); 