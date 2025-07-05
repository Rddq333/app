Page({
  data: {
    isRunning: false,
    loading: false,
    currentTemp: 25,
    targetTemp: 45,
    moxibustionMode: '温灸模式',
    smartAdjustment: true,
    smokeLevel: 15,
    autoVentilation: true,
    smokeMonitoring: true,
    locationMode: '预设穴位',
    selectedAcupoints: ['足三里', '关元', '气海'],
    arAssistance: true,
    smartAvoidance: true,
    treatmentMode: '全疗程治疗',
    singlePointTime: 10,
    fullCourseTime: 45,
    showSinglePointTime: false,
    showFullCourseTime: true,
    remainingTime: '45:00',
    startTime: null,
    timer: null,
    moxibustionModes: ['温灸模式', '热灸模式'],
    locationModes: ['预设穴位', 'AR定位', '手动定位'],
    treatmentModes: ['单穴位治疗', '全疗程治疗'],
    presetAcupoints: [
      '足三里', '关元', '气海', '中脘', '神阙', '命门',
      '肾俞', '脾俞', '肺俞', '心俞', '肝俞', '胃俞'
    ]
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
    const settings = wx.getStorageSync('moxibustionEnhancedSettings');
    if (settings) {
      this.setData({
        ...settings,
        isRunning: wx.getStorageSync('moxibustionEnhancedRunning') || false,
        showSinglePointTime: settings.treatmentMode === '单穴位治疗',
        showFullCourseTime: settings.treatmentMode === '全疗程治疗'
      });
    }
  },

  // 保存设置
  saveSettings() {
    const settings = {
      targetTemp: this.data.targetTemp,
      moxibustionMode: this.data.moxibustionMode,
      smartAdjustment: this.data.smartAdjustment,
      autoVentilation: this.data.autoVentilation,
      smokeMonitoring: this.data.smokeMonitoring,
      locationMode: this.data.locationMode,
      selectedAcupoints: this.data.selectedAcupoints,
      arAssistance: this.data.arAssistance,
      smartAvoidance: this.data.smartAvoidance,
      treatmentMode: this.data.treatmentMode,
      singlePointTime: this.data.singlePointTime,
      fullCourseTime: this.data.fullCourseTime
    };
    wx.setStorageSync('moxibustionEnhancedSettings', settings);
  },

  // 温度变化
  onTempChange(e) {
    this.setData({ targetTemp: e.detail });
    this.saveSettings();
  },

  // 选择艾灸模式
  selectMoxibustionMode() {
    wx.showActionSheet({
      itemList: this.data.moxibustionModes,
      success: (res) => {
        this.setData({ moxibustionMode: this.data.moxibustionModes[res.tapIndex] });
        this.saveSettings();
      }
    });
  },

  // 智能调节开关
  onSmartAdjustmentChange(e) {
    this.setData({ smartAdjustment: e.detail });
    this.saveSettings();
  },

  // 自动排风开关
  onAutoVentilationChange(e) {
    this.setData({ autoVentilation: e.detail });
    this.saveSettings();
  },

  // 烟雾监测开关
  onSmokeMonitoringChange(e) {
    this.setData({ smokeMonitoring: e.detail });
    this.saveSettings();
  },

  // 选择定位模式
  selectLocationMode() {
    wx.showActionSheet({
      itemList: this.data.locationModes,
      success: (res) => {
        this.setData({ locationMode: this.data.locationModes[res.tapIndex] });
        this.saveSettings();
      }
    });
  },

  // 选择预设穴位
  selectPresetAcupoints() {
    wx.showActionSheet({
      itemList: this.data.presetAcupoints,
      success: (res) => {
        const selected = this.data.presetAcupoints[res.tapIndex];
        let acupoints = [...this.data.selectedAcupoints];
        
        if (acupoints.includes(selected)) {
          acupoints = acupoints.filter(point => point !== selected);
        } else {
          acupoints.push(selected);
        }
        
        this.setData({ selectedAcupoints: acupoints });
        this.saveSettings();
      }
    });
  },

  // AR辅助开关
  onArAssistanceChange(e) {
    this.setData({ arAssistance: e.detail });
    this.saveSettings();
  },

  // 智能避让开关
  onSmartAvoidanceChange(e) {
    this.setData({ smartAvoidance: e.detail });
    this.saveSettings();
  },

  // 选择治疗模式
  selectTreatmentMode() {
    wx.showActionSheet({
      itemList: this.data.treatmentModes,
      success: (res) => {
        const selectedMode = this.data.treatmentModes[res.tapIndex];
        this.setData({ 
          treatmentMode: selectedMode,
          showSinglePointTime: selectedMode === '单穴位治疗',
          showFullCourseTime: selectedMode === '全疗程治疗'
        });
        this.saveSettings();
      }
    });
  },

  // 单穴位时间变化
  onSinglePointTimeChange(e) {
    this.setData({ singlePointTime: e.detail });
    this.saveSettings();
  },

  // 全疗程时间变化
  onFullCourseTimeChange(e) {
    this.setData({ fullCourseTime: e.detail });
    this.saveSettings();
  },

  // 切换艾灸
  toggleMoxibustion() {
    if (this.data.isRunning) {
      this.stopMoxibustion();
    } else {
      this.startMoxibustion();
    }
  },

  // 启动艾灸
  startMoxibustion() {
    this.setData({ loading: true });

    setTimeout(() => {
      this.setData({
        isRunning: true,
        loading: false,
        startTime: new Date().toISOString()
      });

      wx.setStorageSync('moxibustionEnhancedRunning', true);
      this.startTimer();

      wx.showToast({
        title: '艾灸理疗已启动',
        icon: 'success'
      });
    }, 1500);
  },

  // 停止艾灸
  stopMoxibustion() {
    this.setData({ loading: true });

    setTimeout(() => {
      this.setData({
        isRunning: false,
        loading: false,
        remainingTime: '45:00'
      });

      wx.setStorageSync('moxibustionEnhancedRunning', false);
      if (this.data.timer) {
        clearInterval(this.data.timer);
        this.setData({ timer: null });
      }

      wx.showToast({
        title: '艾灸理疗已停止',
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
      const totalTime = this.data.treatmentMode === '单穴位治疗' ? 
        this.data.singlePointTime * 60 : this.data.fullCourseTime * 60;
      const remaining = Math.max(0, totalTime - elapsed);

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      const remainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      this.setData({ remainingTime });

      // 时间到自动停止
      if (remaining <= 0) {
        this.stopMoxibustion();
        wx.showToast({
          title: '艾灸理疗已完成',
          icon: 'success'
        });
      }

      // 模拟温度变化
      if (this.data.isRunning && this.data.currentTemp < this.data.targetTemp) {
        this.setData({
          currentTemp: Math.min(this.data.currentTemp + 0.3, this.data.targetTemp)
        });
      }

      // 模拟烟雾浓度变化
      if (this.data.isRunning) {
        const smokeChange = Math.random() > 0.5 ? 1 : -1;
        const newSmokeLevel = Math.max(0, Math.min(100, this.data.smokeLevel + smokeChange));
        this.setData({ smokeLevel: newSmokeLevel });
      }
    }, 1000);

    this.setData({ timer });
  }
}); 