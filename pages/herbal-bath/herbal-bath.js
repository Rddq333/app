// pages/herbal-bath/herbal-bath.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isRunning: false,
    loading: false,
    params: {
      concentration: 20,
      concentrationOptions: [10, 15, 20, 25, 30],
      waterTemp: 40,
      waterTempQuick: [38, 40, 42],
      soakTime: 20,
      soakTimeOptions: [15, 20, 25, 30],
      flowStrength: '中',
      flowStrengthOptions: ['低', '中', '高'],
      herbType: '活血化瘀方',
      herbTypeOptions: ['活血化瘀方', '祛风除湿方', '清热解毒方'],
      herbForm: '药包',
      herbFormOptions: ['药粉', '药包', '浓缩液'],
      herbDose: 'M',
      herbDoseOptions: [
        { label: 'S(10g)', value: 'S' },
        { label: 'M(20g)', value: 'M' },
        { label: 'L(30g)', value: 'L' }
      ]
    },
    concentrationIndex: 2,
    soakTimeIndex: 1,
    herbTypeIndex: 0,
    herbFormIndex: 1,
    herbDoseIndex: 1,
    status: 'idle', // 'idle' | 'running' | 'paused'
    runningTime: '00:00',
    remainingTime: '30:00',
    totalTime: 30 * 60, // 30分钟
    timer: null,
    startTime: null,
    elapsed: 0,
    deviceStatus: '未知',
    deviceConnected: false,
    isPaused: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadSettings();
    this.checkRunningStatus();
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadSettings();
    this.checkRunningStatus();
    this.restoreRunningState();
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('herbalBathSettings');
    if (settings) {
      this.setData({
        ...settings,
        isRunning: wx.getStorageSync('herbalBathRunning') || false
      });
    }
  },

  // 保存设置
  saveSettings() {
    const settings = {
      concentration: this.data.params.concentration,
      waterTemp: this.data.params.waterTemp,
      soakTime: this.data.params.soakTime,
      flowStrength: this.data.params.flowStrength,
      herbType: this.data.params.herbType,
      herbForm: this.data.params.herbForm,
      herbDose: this.data.params.herbDose
    };
    wx.setStorageSync('herbalBathSettings', settings);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 药液浓度
  onConcentrationChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.concentration': this.data.params.concentrationOptions[idx],
      concentrationIndex: idx
    });
  },

  // 水温滑块
  onWaterTempChange(e) {
    this.setData({ 'params.waterTemp': Number(e.detail.value) });
  },

  // 水温快捷按钮
  onQuickTemp(e) {
    this.setData({ 'params.waterTemp': Number(e.currentTarget.dataset.value) });
  },

  // 浸泡时间
  onSoakTimeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.soakTime': this.data.params.soakTimeOptions[idx],
      soakTimeIndex: idx
    });
  },

  // 水流强度
  onFlowStrengthChange(e) {
    this.setData({ 'params.flowStrength': e.detail.value });
  },

  // 药材类型
  onHerbTypeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.herbType': this.data.params.herbTypeOptions[idx],
      herbTypeIndex: idx
    });
  },

  // 药材形态
  onHerbFormChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.herbForm': this.data.params.herbFormOptions[idx],
      herbFormIndex: idx
    });
  },

  // 药材剂量
  onHerbDoseChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      'params.herbDose': this.data.params.herbDoseOptions[idx].value,
      herbDoseIndex: idx
    });
  },

  // 启动药浴
  onStart() {
    // 检查模式互斥
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key && currentTherapyMode.key !== 'herbalBath') {
      wx.showModal({
        title: '模式冲突',
        content: `当前正在运行${currentTherapyMode.name}，请先停止当前模式后再启动药浴`,
        confirmText: '确定',
        showCancel: false
      });
      return;
    }

    const duration = this.data.params.soakTime || 30;
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
    wx.setStorageSync('herbalBathRunning', true);
    wx.setStorageSync('herbalBathPaused', false);
    wx.setStorageSync('herbalBathStatus', 'running');
    
    // 保存当前运行模式
    wx.setStorageSync('currentTherapyMode', {
      key: 'herbalBath',
      name: '中药浴理疗',
      startTime: new Date().toISOString()
    });
    
    wx.showToast({ title: '药浴已启动', icon: 'success' });
  },

  onPause() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
    this.setData({
      status: 'paused',
      isPaused: true
    });
    wx.setStorageSync('herbalBathPaused', true);
    wx.setStorageSync('herbalBathStatus', 'paused');
    wx.showToast({ title: '已暂停', icon: 'none' });
  },

  onResume() {
    const duration = this.data.params.soakTime || 30;
    this.setData({
      status: 'running',
      isPaused: false,
      startTime: Date.now() - this.data.elapsed * 1000
    });
    wx.setStorageSync('herbalBathPaused', false);
    wx.setStorageSync('herbalBathStatus', 'running');
    this.startTimer(duration * 60 - this.data.elapsed);
    wx.showToast({ title: '继续药浴', icon: 'success' });
  },

  onStop() {
    if (this.data.timer) clearInterval(this.data.timer);
    this.setData({
      isRunning: false,
      isPaused: false,
      status: 'idle',
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.params.soakTime * 60 || 1800),
      elapsed: 0
    });
    wx.setStorageSync('herbalBathRunning', false);
    wx.setStorageSync('herbalBathPaused', false);
    wx.setStorageSync('herbalBathStatus', 'idle');
    
    // 清除当前运行模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({ title: '药浴已结束', icon: 'none' });
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

  onToggle() {
    if (this.data.loading) return;
    if (!this.data.isRunning) {
      this.onStart();
    } else if (this.data.isRunning && !this.data.isPaused) {
      this.onPause();
    } else if (this.data.isPaused) {
      this.onResume();
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

  restoreRunningState() {
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    const isRunning = wx.getStorageSync('herbalBathRunning') || false;
    const isPaused = wx.getStorageSync('herbalBathPaused') || false;
    const status = wx.getStorageSync('herbalBathStatus') || 'idle';
    if (currentTherapyMode && currentTherapyMode.key === 'herbalBath' && isRunning) {
      this.setData({
        isRunning: true,
        isPaused: isPaused,
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
})