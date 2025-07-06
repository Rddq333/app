Page({
  data: {
    isRunning: false,
    isPaused: false,
    loading: false,
    status: 'idle', // idle, running, paused
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
    runningTime: '00:00',
    remainingTime: '45:00',
    elapsed: 0,
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
    if (this.data.loading) return;
    
    if (!this.data.isRunning) {
      this.startMoxibustion();
    } else if (this.data.isPaused) {
      this.resumeMoxibustion();
    } else {
      this.pauseMoxibustion();
    }
  },

  // 启动艾灸
  startMoxibustion() {
    // 检查模式互斥
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key && currentTherapyMode.key !== 'moxibustionEnhanced') {
      wx.showModal({
        title: '模式冲突',
        content: `当前正在运行${currentTherapyMode.name}，请先停止当前模式后再启动艾灸理疗`,
        confirmText: '确定',
        showCancel: false
      });
      return;
    }

    this.setData({
      loading: true,
      isRunning: true,
      isPaused: false,
      status: 'running',
      startTime: Date.now(),
      elapsed: 0,
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.treatmentMode === '单穴位治疗' ? 
        this.data.singlePointTime * 60 : this.data.fullCourseTime * 60)
    });

    // 模拟启动过程
    setTimeout(() => {
      this.setData({ loading: false });
      const totalTime = this.data.treatmentMode === '单穴位治疗' ? 
        this.data.singlePointTime * 60 : this.data.fullCourseTime * 60;
      this.startTimer(totalTime);
    }, 1000);
    
    // 保存当前运行模式
    wx.setStorageSync('currentTherapyMode', {
      key: 'moxibustionEnhanced',
      name: '增强艾灸理疗',
      startTime: new Date().toISOString()
    });
    
    wx.showToast({ title: '增强艾灸理疗已启动', icon: 'success' });
  },

  // 暂停艾灸
  pauseMoxibustion() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    this.setData({ 
      status: 'paused',
      isPaused: true
    });
    wx.showToast({ title: '已暂停', icon: 'none' });
  },

  // 继续艾灸
  resumeMoxibustion() {
    const totalTime = this.data.treatmentMode === '单穴位治疗' ? 
      this.data.singlePointTime * 60 : this.data.fullCourseTime * 60;
    this.setData({
      status: 'running',
      isPaused: false,
      startTime: Date.now() - this.data.elapsed * 1000
    });
    this.startTimer(totalTime - this.data.elapsed);
    wx.showToast({ title: '继续理疗', icon: 'success' });
  },

  // 停止艾灸
  stopMoxibustion() {
    if (this.data.timer) clearInterval(this.data.timer);
    this.setData({
      isRunning: false,
      isPaused: false,
      status: 'idle',
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.treatmentMode === '单穴位治疗' ? 
        this.data.singlePointTime * 60 : this.data.fullCourseTime * 60),
      elapsed: 0
    });
    
    // 清除当前运行模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({ title: '增强艾灸理疗已结束', icon: 'none' });
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
        this.stopMoxibustion();
      }
    }, 1000);
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}); 