Page({
  data: {
    isRunning: false,
    isPaused: false,
    loading: false,
    currentTemp: 25,
    targetTemp: 45,
    isProfessionalMode: false,
    selectedWavelength: 'near',
    irradiationMode: '全身均匀照射',
    focusArea: '肩颈部位',
    showFocusArea: false,
    runningTime: '00:00',
    remainingTime: '60:00',
    totalTime: 60 * 60, // 60分钟
    safetySettings: {
      tempProtection: true,
      distanceDetection: true
    },
    wavelengthOptions: [
      {
        label: '近红外 (700-1400nm)',
        value: 'near',
        description: '穿透深度2-3cm，适合浅层组织'
      },
      {
        label: '中红外 (1400-3000nm)',
        value: 'mid',
        description: '穿透深度1-2cm，适合肌肉放松'
      },
      {
        label: '远红外 (3000-10000nm)',
        value: 'far',
        description: '穿透深度0.5-1cm，适合皮肤护理'
      }
    ],
    irradiationModes: [
      '全身均匀照射',
      '局部重点加热',
      '循环交替照射',
      '智能分区控制'
    ],
    focusAreas: [
      '肩颈部位',
      '腰部区域',
      '膝关节',
      '足部区域',
      '背部中心',
      '腹部区域'
    ],
    startTime: null,
    timer: null,
    elapsed: 0,
    params: {
      temp: 45,
      tempQuick: [42, 45, 50],
      wavelength: '中波',
      wavelengthOptions: ['短波', '中波', '长波'],
      time: 20,
      timeOptions: [10, 15, 20, 25, 30],
      distance: 30,
      areaMode: '全身均匀照射',
      areaModeOptions: ['全身均匀照射', '局部重点照射'],
      skinTempMonitor: true,
      autoPowerOff: true,
      intervalRemind: true
    },
    timeIndex: 2,
    areaModeIndex: 0,
    status: 'idle', // 'idle' | 'running' | 'paused'
    deviceStatus: '未知',
    deviceConnected: false,
    StatusBar: 0,
    CustomBar: 0
  },

  onLoad(options) {
    const app = getApp();
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });
    this.loadSettings();
    this.checkRunningStatus();
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  onShow() {
    this.loadSettings();
    this.checkRunningStatus();
    this.restoreRunningState();
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('infraredSettings');
    if (settings) {
      this.setData({
        ...settings,
        isRunning: wx.getStorageSync('infraredRunning') || false,
        status: wx.getStorageSync('infraredStatus') || 'idle',
        showFocusArea: settings.irradiationMode === '局部重点加热'
      });
    }
  },

  // 检查运行状态
  checkRunningStatus() {
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const hasConnectedDevice = historyDevices.some(device => device.connected);
    this.setData({
      deviceConnected: hasConnectedDevice,
      deviceStatus: hasConnectedDevice ? (deviceRunning ? '运行中' : '已连接') : '未连接'
    });
  },

  // 保存设置
  saveSettings() {
    const settings = {
      targetTemp: this.data.targetTemp,
      isProfessionalMode: this.data.isProfessionalMode,
      selectedWavelength: this.data.selectedWavelength,
      irradiationMode: this.data.irradiationMode,
      focusArea: this.data.focusArea,
      safetySettings: this.data.safetySettings
    };
    wx.setStorageSync('infraredSettings', settings);
  },

  // 温度变化
  onTempChange(e) {
    this.setData({ 'params.temp': Number(e.detail.value) });
  },

  // 专业模式切换
  onProfessionalModeChange(e) {
    this.setData({ isProfessionalMode: e.detail });
    if (!e.detail && this.data.targetTemp > 65) {
      this.setData({ targetTemp: 65 });
    }
    this.saveSettings();
  },

  // 选择波长
  selectWavelength(e) {
    const wavelength = e.currentTarget.dataset.wavelength;
    this.setData({ selectedWavelength: wavelength });
    this.saveSettings();
  },

  // 选择照射模式
  selectIrradiationMode() {
    wx.showActionSheet({
      itemList: this.data.irradiationModes,
      success: (res) => {
        const selectedMode = this.data.irradiationModes[res.tapIndex];
        this.setData({ 
          irradiationMode: selectedMode,
          showFocusArea: selectedMode === '局部重点加热'
        });
        this.saveSettings();
      }
    });
  },

  // 选择重点区域
  selectFocusArea() {
    wx.showActionSheet({
      itemList: this.data.focusAreas,
      success: (res) => {
        this.setData({ focusArea: this.data.focusAreas[res.tapIndex] });
        this.saveSettings();
      }
    });
  },

  // 温度保护开关
  onTempProtectionChange(e) {
    this.setData({
      'safetySettings.tempProtection': e.detail
    });
    this.saveSettings();
  },

  // 距离检测开关
  onDistanceDetectionChange(e) {
    this.setData({
      'safetySettings.distanceDetection': e.detail
    });
    this.saveSettings();
  },

  // 切换红外理疗
  onToggle() {
    if (this.data.loading) return;
    if (!this.data.isRunning) {
      this.startInfrared();
    } else if (this.data.isRunning && !this.data.isPaused) {
      this.pauseInfrared();
    } else if (this.data.isPaused) {
      this.resumeInfrared();
    }
  },

  // 启动红外理疗
  startInfrared() {
    // 检查模式互斥
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key && currentTherapyMode.key !== 'infrared') {
      wx.showModal({
        title: '模式冲突',
        content: `当前正在运行${currentTherapyMode.name}，请先停止当前模式后再启动红外理疗`,
        confirmText: '确定',
        showCancel: false
      });
      return;
    }

    const duration = this.data.params.time || 60;
    this.setData({
      isRunning: true,
      isPaused: false,
      status: 'running',
      startTime: Date.now(),
      runningTime: '00:00',
      remainingTime: this.formatTime(duration * 60),
      elapsed: 0
    });
    this.startTimer(duration * 60);
    wx.setStorageSync('infraredRunning', true);
    wx.setStorageSync('infraredStatus', 'running');
    
    // 保存当前运行模式
    wx.setStorageSync('currentTherapyMode', {
      key: 'infrared',
      name: '红外理疗',
      startTime: new Date().toISOString()
    });
    
    wx.showToast({ title: '红外理疗已启动', icon: 'success' });
  },

  // 暂停红外理疗
  pauseInfrared() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    this.setData({
      status: 'paused',
      isPaused: true
    });
    wx.setStorageSync('infraredStatus', 'paused');
    wx.showToast({ title: '已暂停', icon: 'none' });
  },

  // 继续红外理疗
  resumeInfrared() {
    const duration = this.data.params.time || 60;
    this.setData({
      status: 'running',
      isPaused: false,
      startTime: Date.now() - this.data.elapsed * 1000
    });
    wx.setStorageSync('infraredStatus', 'running');
    this.startTimer(duration * 60 - this.data.elapsed);
    wx.showToast({ title: '继续理疗', icon: 'success' });
  },

  // 停止红外理疗
  stopInfrared() {
    if (this.data.timer) clearInterval(this.data.timer);
    this.setData({
      isRunning: false,
      isPaused: false,
      status: 'idle',
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.params.time * 60 || 3600),
      elapsed: 0
    });
    wx.setStorageSync('infraredRunning', false);
    wx.setStorageSync('infraredStatus', 'idle');
    
    // 清除当前运行模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({ title: '红外理疗已结束', icon: 'none' });
  },

  // 启动计时器
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
        this.stopInfrared();
      }
    }, 1000);
  },

  // 温度快捷按钮
  onQuickTemp(e) {
    this.setData({ 'params.temp': Number(e.currentTarget.dataset.value) });
  },

  // 波长选择
  onWavelengthChange(e) {
    this.setData({ 'params.wavelength': e.detail.value });
  },

  // 治疗时间选择
  onTimeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.time': this.data.params.timeOptions[idx],
      timeIndex: idx
    });
  },

  // 照射距离滑块
  onDistanceChange(e) {
    this.setData({ 'params.distance': Number(e.detail.value) });
  },

  // 照射模式选择
  onAreaModeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.areaMode': this.data.params.areaModeOptions[idx],
      areaModeIndex: idx
    });
  },

  // 皮肤温度监测
  onSkinTempMonitorChange(e) {
    this.setData({ 'params.skinTempMonitor': e.detail.value });
  },

  // 自动断电保护
  onAutoPowerOffChange(e) {
    this.setData({ 'params.autoPowerOff': e.detail.value });
  },

  // 使用间隔提醒
  onIntervalRemindChange(e) {
    this.setData({ 'params.intervalRemind': e.detail.value });
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  restoreRunningState() {
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    const isRunning = wx.getStorageSync('infraredRunning') || false;
    const status = wx.getStorageSync('infraredStatus') || 'idle';
    if (currentTherapyMode && currentTherapyMode.key === 'infrared' && isRunning) {
      this.setData({
        isRunning: true,
        isPaused: status === 'paused',
        status: status
      });
    } else {
      this.setData({
        isRunning: false,
        isPaused: false,
        status: 'idle'
      });
    }
  }
}); 