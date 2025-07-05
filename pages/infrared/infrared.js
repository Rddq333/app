Page({
  data: {
    isRunning: false,
    loading: false,
    currentTemp: 25,
    targetTemp: 45,
    isProfessionalMode: false,
    selectedWavelength: 'near',
    irradiationMode: '全身均匀照射',
    focusArea: '肩颈部位',
    showFocusArea: false,
    remainingTime: '60分钟',
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
    timer: null
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
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('infraredSettings');
    if (settings) {
      this.setData({
        ...settings,
        isRunning: wx.getStorageSync('infraredRunning') || false,
        showFocusArea: settings.irradiationMode === '局部重点加热'
      });
    }
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
    this.setData({ targetTemp: e.detail });
    this.saveSettings();
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
  toggleInfrared() {
    if (this.data.isRunning) {
      this.stopInfrared();
    } else {
      this.startInfrared();
    }
  },

  // 启动红外理疗
  startInfrared() {
    this.setData({ loading: true });

    // 模拟启动过程
    setTimeout(() => {
      this.setData({
        isRunning: true,
        loading: false,
        startTime: new Date().toISOString()
      });

      wx.setStorageSync('infraredRunning', true);
      this.startTimer();

      wx.showToast({
        title: '红外理疗已启动',
        icon: 'success'
      });
    }, 1500);
  },

  // 停止红外理疗
  stopInfrared() {
    this.setData({ loading: true });

    setTimeout(() => {
      this.setData({
        isRunning: false,
        loading: false,
        remainingTime: '60分钟'
      });

      wx.setStorageSync('infraredRunning', false);
      if (this.data.timer) {
        clearInterval(this.data.timer);
        this.setData({ timer: null });
      }

      wx.showToast({
        title: '红外理疗已停止',
        icon: 'none'
      });
    }, 1000);
  },

  // 启动计时器
  startTimer() {
    const timer = setInterval(() => {
      const startTime = new Date(this.data.startTime);
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, 60 * 60 - elapsed); // 60分钟

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      const remainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      this.setData({ remainingTime });

      // 时间到自动停止
      if (remaining <= 0) {
        this.stopInfrared();
        wx.showToast({
          title: '红外理疗时间已到',
          icon: 'success'
        });
      }

      // 模拟温度变化
      if (this.data.isRunning && this.data.currentTemp < this.data.targetTemp) {
        this.setData({
          currentTemp: Math.min(this.data.currentTemp + 0.5, this.data.targetTemp)
        });
      }
    }, 1000);

    this.setData({ timer });
  }
}); 