// custom-config.js
Page({
  data: {
    modeConfigs: [], // 选中的模式配置
    currentModeIndex: 0, // 当前显示的模式索引
    isRunning: false,
    isPaused: false,
    runningTime: '00:00',
    remainingTime: '00:00',
    timer: null,
    startTime: null,
    totalDuration: 0, // 总时长（分钟）
    loading: false,
    
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
    }
  },

  onLoad() {
    this.loadModeConfigs();
    this.checkRunningStatus();
  },

  onShow() {
    this.checkRunningStatus();
  },

  onUnload() {
    // 清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  // 检查运行状态
  checkRunningStatus() {
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    const isRunning = wx.getStorageSync('customModeRunning') || false;
    const startTime = wx.getStorageSync('customModeStartTime');
    const isPaused = wx.getStorageSync('customModePaused') || false;
    
    // 检查当前运行模式是否为自定义模式
    if (currentTherapyMode && currentTherapyMode.key === 'custom') {
      this.setData({ 
        isRunning: true,
        isPaused,
        startTime: startTime ? new Date(startTime) : null
      });

      if (isRunning && !isPaused && startTime) {
        this.startTimer();
      }
    } else {
      // 如果不是自定义模式在运行，清除自定义模式状态
      this.setData({ 
        isRunning: false,
        isPaused: false,
        startTime: null
      });
      
      // 清除自定义模式的存储
      wx.removeStorageSync('customModeRunning');
      wx.removeStorageSync('customModeStartTime');
      wx.removeStorageSync('customModePaused');
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
    this.setData({ totalDuration: total });
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
    this.setData({ loading: true });

    // 检查是否选择了模式
    if (!this.data.modeConfigs || this.data.modeConfigs.length === 0) {
      wx.showToast({
        title: '请先选择理疗模式',
        icon: 'none'
      });
      this.setData({ loading: false });
      return;
    }

    // 检查设备连接状态
    const deviceConnected = wx.getStorageSync('deviceConnected') || false;
    if (!deviceConnected) {
      wx.showToast({
        title: '请先连接设备',
        icon: 'none'
      });
      this.setData({ loading: false });
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
    wx.setStorageSync('currentTherapyMode', {
      key: 'custom',
      name: '自定义模式',
      description: `组合功能：${selectedNames}`,
      duration: '自定义',
      selectedModes: this.data.modeConfigs.map(config => config.key),
      startTime: new Date().toISOString()
    });

    const startTime = new Date();
    this.setData({
      isRunning: true,
      isPaused: false,
      startTime: startTime,
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.totalDuration * 60),
      loading: false
    });

    // 启动定时器
    this.startTimer();

    // 保存运行状态
    wx.setStorageSync('customModeRunning', true);
    wx.setStorageSync('customModeStartTime', startTime.toISOString());
    wx.setStorageSync('customModePaused', false);

    wx.showToast({
      title: '自定义模式已启动',
      icon: 'success'
    });
  },

  // 启动定时器
  startTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }

    const timer = setInterval(() => {
      this.updateRunningTime();
    }, 1000);

    this.setData({ timer });
  },

  // 统一的启动/暂停/继续按钮
  toggleCustomMode() {
    if (this.data.loading) return;
    
    if (!this.data.isRunning) {
      // 如果未运行，启动模式
      this.startCustomMode();
    } else if (this.data.isPaused) {
      // 如果已暂停，继续模式
      this.resumeMode();
    } else {
      // 如果正在运行，暂停模式
      this.pauseMode();
    }
  },

  // 暂停模式
  pauseMode() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }

    this.setData({ isPaused: true });
    wx.setStorageSync('customModePaused', true);

    wx.showToast({
      title: '模式已暂停',
      icon: 'none'
    });
  },

  // 继续模式
  resumeMode() {
    this.startTimer();
    this.setData({ isPaused: false });
    wx.setStorageSync('customModePaused', false);

    wx.showToast({
      title: '模式已继续',
      icon: 'success'
    });
  },

  // 停止模式
  stopCustomMode() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }

    this.setData({
      isRunning: false,
      isPaused: false,
      timer: null,
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.totalDuration * 60)
    });

    // 清除运行状态
    wx.removeStorageSync('currentTherapyMode');
    wx.removeStorageSync('customModeRunning');
    wx.removeStorageSync('customModeStartTime');
    wx.removeStorageSync('customModePaused');

    wx.showToast({
      title: '模式已停止',
      icon: 'success'
    });
  },

  // 更新运行时间
  updateRunningTime() {
    if (!this.data.startTime || this.data.isPaused) return;

    const now = new Date();
    const elapsed = Math.floor((now - this.data.startTime) / 1000);
    const remaining = Math.max(0, this.data.totalDuration * 60 - elapsed);

    this.setData({
      runningTime: this.formatTime(elapsed),
      remainingTime: this.formatTime(remaining)
    });

    // 检查是否完成
    if (remaining <= 0) {
      this.stopCustomMode();
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
  }
}); 