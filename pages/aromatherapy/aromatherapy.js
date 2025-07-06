// pages/aromatherapy/aromatherapy.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 运行状态
    isRunning: false,
    isPaused: false,
    loading: false,
    
    // 基础香氛参数
    selectedAromaType: '薰衣草',
    concentration: 3,
    diffusionMode: '间歇',
    duration: 30,
    
    // 情境模式参数
    selectedScenario: '自定义',
    scenarioConfig: {},
    
    // 高级设置
    autoAdjust: false,
    smartInterval: true,
    environmentMonitor: true,
    
    // 运行信息
    runningTime: '00:00',
    remainingTime: '30:00',
    currentConcentration: 3,
    diffusionStatus: '待启动',
    
    // picker索引
    aromaTypeIndex: 0,
    diffusionModeIndex: 0,
    durationIndex: 3, // 30分钟对应索引
    scenarioIndex: 0,
    
    // 选项数据
    aromaTypes: [
      '薰衣草', '柠檬', '薄荷', '玫瑰', '洋甘菊', 
      '迷迭香', '佛手柑', '雪松', '茶树', '橙花', 
      '茉莉', '依兰'
    ],
    diffusionModes: ['间歇', '持续', '脉冲'],
    durationOptions: [
      '15分钟', '20分钟', '25分钟', '30分钟', 
      '45分钟', '60分钟', '90分钟', '120分钟'
    ],
    scenarioOptions: ['自定义', '助眠', '提神', '放松'],
    
    // 情境模式配置
    scenarioConfigs: {
      '助眠': {
        recommendedAroma: '薰衣草+洋甘菊',
        recommendedConcentration: 2,
        diffusionRhythm: '慢脉冲（30s/次）',
        lightMode: '暖黄光'
      },
      '提神': {
        recommendedAroma: '柠檬+迷迭香',
        recommendedConcentration: 3,
        diffusionRhythm: '快脉冲（10s/次）',
        lightMode: '冷白光'
      },
      '放松': {
        recommendedAroma: '佛手柑+雪松',
        recommendedConcentration: 2,
        diffusionRhythm: '间歇（15min开/5min关）',
        lightMode: '淡蓝光'
      }
    },
    
    // 定时器
    timer: null,
    startTime: null,
    elapsedTime: 0,
    deviceStatus: '未知',
    deviceConnected: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initData();
    this.checkRunningStatus();
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
    this.checkRunningStatus();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.clearTimer();
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

  // 初始化数据
  initData() {
    this.setData({
      scenarioConfig: this.data.scenarioConfigs['助眠'] || {}
    });
  },

  // 香氛类型选择
  onAromaTypeChange(event) {
    const index = event.detail.value;
    const selectedAromaType = this.data.aromaTypes[index];
    this.setData({
      aromaTypeIndex: index,
      selectedAromaType
    });
  },

  // 浓度调节
  onConcentrationChange(event) {
    const concentration = event.detail;
    this.setData({ 
      concentration,
      currentConcentration: concentration
    });
  },

  // 扩散方式选择
  onDiffusionModeChange(event) {
    const index = event.detail.value;
    const diffusionMode = this.data.diffusionModes[index];
    this.setData({
      diffusionModeIndex: index,
      diffusionMode
    });
  },

  // 持续时间选择
  onDurationChange(event) {
    const index = event.detail.value;
    const durationText = this.data.durationOptions[index];
    const duration = parseInt(durationText);
    this.setData({
      durationIndex: index,
      duration,
      remainingTime: this.formatTime(duration * 60)
    });
  },

  // 情境模式选择
  onScenarioChange(event) {
    const index = event.detail.value;
    const selectedScenario = this.data.scenarioOptions[index];
    const scenarioConfig = this.data.scenarioConfigs[selectedScenario] || {};
    
    this.setData({
      scenarioIndex: index,
      selectedScenario,
      scenarioConfig
    });

    // 如果选择了预设情境，自动应用推荐参数
    if (selectedScenario !== '自定义' && scenarioConfig) {
      this.setData({
        selectedAromaType: scenarioConfig.recommendedAroma.split('+')[0],
        concentration: scenarioConfig.recommendedConcentration,
        currentConcentration: scenarioConfig.recommendedConcentration
      });
    }
  },

  // 高级设置开关（适配picker）
  onAutoAdjustChange(event) {
    const value = event.detail.value !== undefined ? event.detail.value : event.detail;
    this.setData({ autoAdjust: value == 1 });
  },

  onSmartIntervalChange(event) {
    const value = event.detail.value !== undefined ? event.detail.value : event.detail;
    this.setData({ smartInterval: value == 1 });
  },

  onEnvironmentMonitorChange(event) {
    const value = event.detail.value !== undefined ? event.detail.value : event.detail;
    this.setData({ environmentMonitor: value == 1 });
  },

  // 启动/暂停理疗
  toggleAromatherapy() {
    if (this.data.loading) return;
    
    if (!this.data.isRunning) {
      this.startAromatherapy();
    } else if (this.data.isPaused) {
      this.continueAromatherapy();
    } else {
      this.pauseAromatherapy();
    }
  },

  // 启动理疗
  startAromatherapy() {
    // 检查模式互斥
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key && currentTherapyMode.key !== 'aromatherapy') {
      wx.showModal({
        title: '模式冲突',
        content: `当前正在运行${currentTherapyMode.name}，请先停止当前模式后再启动香氛理疗`,
        confirmText: '确定',
        showCancel: false
      });
      return;
    }

    this.setData({
      loading: true,
      isRunning: true,
      isPaused: false,
      diffusionStatus: '运行中',
      startTime: Date.now(),
      elapsedTime: 0,
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.duration * 60)
    });

    // 模拟启动过程
    setTimeout(() => {
      this.setData({ loading: false });
      this.startTimer();
    }, 1000);
    
    // 保存当前运行模式
    wx.setStorageSync('currentTherapyMode', {
      key: 'aromatherapy',
      name: '香氛理疗',
      startTime: new Date().toISOString()
    });
    
    wx.showToast({ title: '香氛理疗已启动', icon: 'success' });
  },

  // 暂停理疗
  pauseAromatherapy() {
    this.setData({
      isPaused: true,
      diffusionStatus: '已暂停'
    });
    this.clearTimer();
    wx.showToast({ title: '已暂停', icon: 'none' });
  },

  // 继续理疗
  continueAromatherapy() {
    this.setData({
      isPaused: false,
      diffusionStatus: '运行中'
    });
    this.startTimer();
    wx.showToast({ title: '继续理疗', icon: 'success' });
  },

  // 结束理疗
  stopAromatherapy() {
    this.setData({
      isRunning: false,
      isPaused: false,
      diffusionStatus: '已停止',
      runningTime: '00:00',
      remainingTime: this.formatTime(this.data.duration * 60)
    });
    this.clearTimer();
    
    // 清除当前运行模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({ title: '香氛理疗已结束', icon: 'none' });
  },

  // 启动定时器
  startTimer() {
    this.clearTimer();
    this.data.timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - this.data.startTime) / 1000);
      const remaining = Math.max(0, this.data.duration * 60 - elapsed);
      
      this.setData({
        elapsedTime: elapsed,
        runningTime: this.formatTime(elapsed),
        remainingTime: this.formatTime(remaining)
      });

      if (remaining <= 0) {
        this.stopAromatherapy();
      }
    }, 1000);
  },

  // 清除定时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  // 格式化时间
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  }
});