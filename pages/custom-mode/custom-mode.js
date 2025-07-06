// custom-mode.js
Page({
  data: {
    modeConfigs: [], // 选中的模式配置
    currentModeIndex: 0, // 当前显示的模式索引
    isRunning: false,
    isPaused: false, // 添加暂停状态
    runningTime: '00:00',
    remainingTime: '00:00',
    timer: null,
    startTime: null,
    totalDuration: 0, // 总时长（分钟）
    loading: false,
    status: 'idle', // 添加状态：idle, running, paused
    deviceConnected: false, // 设备连接状态
    deviceStatus: '未知', // 设备状态
    
    // 各模式的参数配置
    modeParams: {
      infrared: {
        temperature: 45,
        duration: 30,
        intensity: 3,
        area: '全身'
      },
      hydrotherapy: {
        waterTemp: 38,
        pressure: 2,
        massageMode: ['脉冲', '旋转'],
        focusArea: ['背部', '腰部'],
        duration: 45
      },
      moxibustion: {
        temperature: 60,
        duration: 60,
        intensity: 2,
        area: '背部',
        mode: '温和'
      },
      herbalBath: {
        waterTemp: 40,
        herbType: '艾草',
        concentration: 3,
        duration: 40,
        mode: '浸泡'
      },
      aromatherapy: {
        oilType: '薰衣草',
        concentration: 2,
        duration: 35,
        mode: '喷雾',
        intensity: 3
      },
      musicTherapy: {
        genre: '自然音',
        volume: 60,
        frequency: 432,
        rhythm: 60,
        duration: 25,
        brainwaveSync: true,
        surround3d: false,
        dynamicLighting: true,
        seatVibration: false
      }
    },
    // 颜色映射
    modeColorMap: {
      infrared: '#ef4444',
      hydrotherapy: '#3b82f6',
      moxibustion: '#f59e0b',
      herbalBath: '#10b981',
      aromatherapy: '#8b5cf6',
      musicTherapy: '#ec4899'
    },
    modeBgColorMap: {
      infrared: '#fff5f5',
      hydrotherapy: '#f0f7ff',
      moxibustion: '#fff9ec',
      herbalBath: '#f3fdf7',
      aromatherapy: '#f7f5ff',
      musicTherapy: '#fff5fa'
    }
  },

  onLoad() {
    this.loadModeConfigs();
    this.loadRunningState();
  },

  onShow() {
    // 每次显示页面时检查运行状态
    this.loadRunningState();
  },

  onUnload() {
    // 清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  // 加载运行状态
  loadRunningState() {
    // 检查设备状态
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const hasConnectedDevice = historyDevices.some(device => device.connected);
    
    this.setData({
      deviceConnected: hasConnectedDevice,
      deviceStatus: hasConnectedDevice ? (deviceRunning ? '运行中' : '已连接') : '未连接'
    });

    const isRunning = wx.getStorageSync('customModeRunning') || false;
    const startTime = wx.getStorageSync('customModeStartTime');
    const currentMode = wx.getStorageSync('currentTherapyMode');
    
    if (isRunning && startTime && currentMode && currentMode.key === 'custom') {
      const startTimeObj = new Date(startTime);
      const now = new Date();
      const elapsed = Math.floor((now - startTimeObj) / 1000);
      
      this.setData({
        isRunning: true,
        startTime: startTimeObj,
        runningTime: this.formatTime(elapsed),
        remainingTime: this.formatTime(Math.max(0, this.data.totalDuration * 60 - elapsed)),
        status: 'running'
      });
      
      // 重新启动定时器
      this.startTimer();
    } else {
      this.setData({
        isRunning: false,
        isPaused: false,
        status: 'idle',
        runningTime: '00:00',
        remainingTime: this.formatTime(this.data.totalDuration * 60)
      });
    }
  },

  // 加载模式配置
  loadModeConfigs() {
    const modeConfigs = wx.getStorageSync('customModeConfigs') || [];
    this.setData({ modeConfigs });
    
    if (modeConfigs.length > 0) {
      this.calculateTotalDuration();
    }
  },

  // 计算总时长
  calculateTotalDuration() {
    let total = 0;
    this.data.modeConfigs.forEach(config => {
      const params = this.data.modeParams[config.key];
      if (params && params.duration) {
        total += params.duration;
      }
    });
    this.setData({ 
      totalDuration: total,
      remainingTime: this.formatTime(total * 60)
    });
  },

  // 切换模式显示
  switchMode(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentModeIndex: index });
  },

  // 参数变化处理
  onParamChange(e) {
    const { mode, param, value } = e.currentTarget.dataset;
    const modeParams = { ...this.data.modeParams };
    
    if (modeParams[mode]) {
      modeParams[mode][param] = value;
      this.setData({ modeParams });
    }
  },

  // 多选参数变化
  onMultiParamChange(e) {
    const { mode, param } = e.currentTarget.dataset;
    const value = e.detail;
    const modeParams = { ...this.data.modeParams };
    
    if (modeParams[mode]) {
      modeParams[mode][param] = value;
      this.setData({ modeParams });
    }
  },

  // 启动自定义模式
  startCustomMode() {
    // 检查是否有选中的模式
    if (this.data.modeConfigs.length === 0) {
      wx.showToast({
        title: '请先选择理疗模式',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 检查设备连接状态 - 修改检查逻辑
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const hasConnectedDevice = historyDevices.some(device => device.connected);
    
    if (!hasConnectedDevice) {
      wx.showModal({
        title: '设备未连接',
        content: '请先连接设备后再启动自定义模式',
        confirmText: '去连接',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/appconnect/appconnect' });
          }
          this.setData({ loading: false });
        }
      });
      return;
    }

    if (!deviceRunning) {
      wx.showModal({
        title: '设备未启动',
        content: '请先启动设备后再启动自定义模式',
        confirmText: '去启动',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/appconnect/appconnect' });
          }
          this.setData({ loading: false });
        }
      });
      return;
    }

    // 检查是否有其他模式在运行
    const currentMode = wx.getStorageSync('currentTherapyMode');
    if (currentMode && currentMode.key !== 'custom') {
      wx.showModal({
        title: '提示',
        content: `当前有${currentMode.name}正在运行，是否停止并启动自定义模式？`,
        success: (res) => {
          if (res.confirm) {
            this.stopOtherModes();
            this.startMode();
          } else {
            this.setData({ loading: false });
          }
        }
      });
      return;
    }

    this.startMode();
  },

  // 停止其他模式
  stopOtherModes() {
    const currentMode = wx.getStorageSync('currentTherapyMode');
    if (currentMode && currentMode.key !== 'custom') {
      // 清除其他模式的运行状态
      wx.removeStorageSync('currentTherapyMode');
      wx.removeStorageSync(`${currentMode.key}Running`);
      wx.removeStorageSync(`${currentMode.key}StartTime`);
      wx.removeStorageSync(`${currentMode.key}Paused`);
    }
  },

  // 启动模式
  startMode() {
    // 保存当前运行模式
    const selectedNames = this.data.modeConfigs.map(config => config.name).join('、');
    const currentKey = this.data.modeConfigs[this.data.currentModeIndex].key;
    const currentDuration = this.data.modeParams[currentKey].duration || 30;
    wx.setStorageSync('currentTherapyMode', {
      key: 'custom',
      name: '自定义模式',
      description: `组合功能：${selectedNames}`,
      duration: '自定义',
      selectedModes: this.data.modeConfigs.map(config => config.key),
      startTime: new Date().toISOString()
    });

    this.setData({
      isRunning: true,
      isPaused: false,
      status: 'running',
      startTime: new Date(),
      runningTime: '00:00',
      remainingTime: this.formatTime(currentDuration * 60),
      loading: false
    });

    // 启动定时器
    this.startTimer();

    // 保存运行状态
    wx.setStorageSync('customModeRunning', true);
    wx.setStorageSync('customModeStartTime', this.data.startTime.toISOString());

    wx.showToast({
      title: '自定义模式已启动',
      icon: 'success'
    });
  },

  // 暂停模式
  pauseMode() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }

    this.setData({
      isPaused: true,
      status: 'paused'
    });

    wx.showToast({
      title: '模式已暂停',
      icon: 'none'
    });
  },

  // 继续模式
  resumeMode() {
    this.startTimer();

    this.setData({
      isPaused: false,
      status: 'running'
    });

    wx.showToast({
      title: '模式已继续',
      icon: 'success'
    });
  },

  // 停止模式
  stopMode() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }

    this.setData({
      isRunning: false,
      isPaused: false,
      status: 'idle',
      timer: null,
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.totalDuration * 60)
    });

    // 清除运行状态
    wx.setStorageSync('customModeRunning', false);
    wx.removeStorageSync('customModeStartTime');
    wx.removeStorageSync('currentTherapyMode');

    wx.showToast({
      title: '模式已停止',
      icon: 'none'
    });
  },

  // 启动定时器
  startTimer() {
    if (this.data.timer) clearInterval(this.data.timer);
    const currentKey = this.data.modeConfigs[this.data.currentModeIndex].key;
    const currentDuration = this.data.modeParams[currentKey].duration || 30;
    const totalSeconds = currentDuration * 60;
    const timer = setInterval(() => {
      this.updateRunningTime();
    }, 1000);
    this.setData({ timer, totalSeconds });
  },

  // 更新运行时间
  updateRunningTime() {
    if (!this.data.startTime) return;
    const now = new Date();
    const elapsed = Math.floor((now - this.data.startTime) / 1000);
    const currentKey = this.data.modeConfigs[this.data.currentModeIndex].key;
    const currentDuration = this.data.modeParams[currentKey].duration || 30;
    const totalSeconds = currentDuration * 60;
    const remaining = Math.max(0, totalSeconds - elapsed);
    this.setData({
      runningTime: this.formatTime(elapsed),
      remainingTime: this.formatTime(remaining)
    });
    // 检查是否完成
    if (remaining <= 0) {
      this.stopMode();
      wx.showToast({
        title: '自定义模式已完成',
        icon: 'success'
      });
    }
  },

  // 格式化时间
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // 跳转到具体模式页面
  goToModePage(e) {
    const modeKey = e.currentTarget.dataset.mode;
    wx.navigateTo({
      url: `/pages/${modeKey}/${modeKey}`
    });
  },

  onQuickTimeSelect(e) {
    const { mode, param, value } = e.currentTarget.dataset;
    const modeParams = { ...this.data.modeParams };
    if (modeParams[mode]) {
      modeParams[mode][param] = Number(value);
      this.setData({ modeParams });
    }
  }
}); 