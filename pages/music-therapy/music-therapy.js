// pages/music-therapy/music-therapy.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 运行状态
    isRunning: false,
    isPaused: false,
    loading: false,
    
    // 核心治疗参数
    selectedMusicType: 'α波',
    frequency: 432,
    volume: 60,
    rhythm: 72,
    
    // 情境模式参数
    selectedScenario: '自定义',
    scenarioConfig: {},
    
    // 高级设置
    brainwaveSync: true,
    surround3d: true,
    dynamicLighting: false,
    seatVibration: false,
    
    // 运行信息
    runningTime: '00:00',
    remainingTime: '30:00',
    currentFrequency: 432,
    currentRhythm: 72,
    playStatus: '待启动',
    
    // picker索引
    musicTypeIndex: 0,
    scenarioIndex: 0,
    
    // 选项数据
    musicTypes: ['α波', 'θ波', '自然音', '器乐'],
    scenarioOptions: ['自定义', '深度放松', '专注提升', '情绪释放'],
    
    // 情境模式配置
    scenarioConfigs: {
      '深度放松': {
        recommendedMusic: 'θ波+溪流声',
        recommendedFrequency: 432,
        recommendedRhythm: 60,
        additionalEffect: '座椅微振动'
      },
      '专注提升': {
        recommendedMusic: 'α波+钢琴',
        recommendedFrequency: 528,
        recommendedRhythm: 90,
        additionalEffect: '蓝光刺激'
      },
      '情绪释放': {
        recommendedMusic: '鼓乐+人声',
        recommendedFrequency: 396,
        recommendedRhythm: 120,
        additionalEffect: '动态灯光'
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
    this.restoreRunningState();
    // 实时刷新运行时间
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    const isRunning = wx.getStorageSync('musicTherapyRunning') || false;
    const status = this.data.playStatus || '待启动';
    if (currentTherapyMode && currentTherapyMode.key === 'musicTherapy' && isRunning && status === '运行中') {
      const startTime = new Date(currentTherapyMode.startTime).getTime();
      const totalSeconds = (this.data.rhythm || 30) * 60;
      this.setData({ startTime });
      this.startTimer(totalSeconds);
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.clearTimer && this.clearTimer();
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
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
      scenarioConfig: this.data.scenarioConfigs['深度放松'] || {}
    });
  },

  // 音乐类型选择
  onMusicTypeChange(event) {
    const index = event.detail.value;
    const selectedMusicType = this.data.musicTypes[index];
    this.setData({
      musicTypeIndex: index,
      selectedMusicType
    });
  },

  // 频率调节
  onFrequencyChange(event) {
    const frequency = event.detail;
    this.setData({ 
      frequency,
      currentFrequency: frequency
    });
  },

  // 音量调节
  onVolumeChange(event) {
    const volume = event.detail;
    this.setData({ volume });
  },

  // 节奏调节
  onRhythmChange(event) {
    const rhythm = event.detail;
    this.setData({ 
      rhythm,
      currentRhythm: rhythm
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
        selectedMusicType: scenarioConfig.recommendedMusic.split('+')[0],
        frequency: scenarioConfig.recommendedFrequency,
        currentFrequency: scenarioConfig.recommendedFrequency,
        rhythm: scenarioConfig.recommendedRhythm,
        currentRhythm: scenarioConfig.recommendedRhythm,
        seatVibration: selectedScenario === '深度放松',
        dynamicLighting: selectedScenario === '情绪释放'
      });
    }
  },

  // 高级设置开关（适配picker）
  onBrainwaveSyncChange(event) {
    const value = event.detail.value !== undefined ? event.detail.value : event.detail;
    this.setData({ brainwaveSync: value == 1 });
  },

  onSurround3dChange(event) {
    const value = event.detail.value !== undefined ? event.detail.value : event.detail;
    this.setData({ surround3d: value == 1 });
  },

  onDynamicLightingChange(event) {
    const value = event.detail.value !== undefined ? event.detail.value : event.detail;
    this.setData({ dynamicLighting: value == 1 });
  },

  onSeatVibrationChange(event) {
    const value = event.detail.value !== undefined ? event.detail.value : event.detail;
    this.setData({ seatVibration: value == 1 });
  },

  // 启动/暂停理疗
  toggleMusicTherapy() {
    if (this.data.loading) return;
    
    if (!this.data.isRunning) {
      this.startMusicTherapy();
    } else if (this.data.isPaused) {
      this.continueMusicTherapy();
    } else {
      this.pauseMusicTherapy();
    }
  },

  // 启动理疗
  startMusicTherapy() {
    // 检查模式互斥
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    if (currentTherapyMode && currentTherapyMode.key && currentTherapyMode.key !== 'musicTherapy') {
      wx.showModal({
        title: '模式冲突',
        content: `当前正在运行${currentTherapyMode.name}，请先停止当前模式后再启动音乐理疗`,
        confirmText: '确定',
        showCancel: false
      });
      return;
    }

    this.setData({
      loading: true,
      isRunning: true,
      isPaused: false,
      playStatus: '播放中',
      startTime: Date.now(),
      elapsedTime: 0,
      runningTime: '00:00',
      remainingTime: this.formatTime(30 * 60)
    });
    wx.setStorageSync('musicTherapyRunning', true);
    wx.setStorageSync('musicTherapyPaused', false);
    wx.setStorageSync('musicTherapyStatus', '播放中');
    
    // 模拟启动过程
    setTimeout(() => {
      this.setData({ loading: false });
      this.startTimer();
    }, 1000);
    
    // 保存当前运行模式
    wx.setStorageSync('currentTherapyMode', {
      key: 'musicTherapy',
      name: '音乐理疗',
      startTime: new Date().toISOString()
    });
    
    wx.showToast({ title: '音乐理疗已启动', icon: 'success' });
  },

  // 暂停理疗
  pauseMusicTherapy() {
    this.setData({
      isPaused: true,
      playStatus: '已暂停'
    });
    wx.setStorageSync('musicTherapyPaused', true);
    wx.setStorageSync('musicTherapyStatus', '已暂停');
    this.clearTimer();
    wx.showToast({ title: '已暂停', icon: 'none' });
  },

  // 继续理疗
  continueMusicTherapy() {
    this.setData({
      isPaused: false,
      playStatus: '播放中'
    });
    wx.setStorageSync('musicTherapyPaused', false);
    wx.setStorageSync('musicTherapyStatus', '播放中');
    this.startTimer();
    wx.showToast({ title: '继续理疗', icon: 'success' });
  },

  // 结束理疗
  stopMusicTherapy() {
    this.setData({
      isRunning: false,
      isPaused: false,
      playStatus: '已停止',
      runningTime: '00:00',
      remainingTime: this.formatTime(30 * 60)
    });
    wx.setStorageSync('musicTherapyRunning', false);
    wx.setStorageSync('musicTherapyPaused', false);
    wx.setStorageSync('musicTherapyStatus', '已停止');
    this.clearTimer();
    
    // 清除当前运行模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({ title: '音乐理疗已结束', icon: 'none' });
  },

  // 启动定时器
  startTimer(totalSeconds) {
    this.clearTimer();
    this.data.timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - this.data.startTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      
      this.setData({
        elapsedTime: elapsed,
        runningTime: this.formatTime(elapsed),
        remainingTime: this.formatTime(remaining)
      });

      if (remaining <= 0) {
        this.stopMusicTherapy();
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

  // 获取频率描述
  getFrequencyDesc(frequency) {
    if (frequency === 432) return '疗愈频率';
    if (frequency === 528) return '修复频率';
    if (frequency === 396) return '释放频率';
    if (frequency < 100) return '超低频';
    if (frequency < 1000) return '低频';
    if (frequency < 5000) return '中频';
    return '高频';
  },

  // 获取音量描述
  getVolumeDesc(volume) {
    if (volume < 50) return '安静';
    if (volume < 60) return '适中';
    if (volume < 70) return '较响';
    return '很响';
  },

  // 获取节奏描述
  getRhythmDesc(rhythm) {
    if (rhythm < 70) return '慢节奏';
    if (rhythm < 90) return '中节奏';
    return '快节奏';
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
    const isRunning = wx.getStorageSync('musicTherapyRunning') || false;
    const isPaused = wx.getStorageSync('musicTherapyPaused') || false;
    const playStatus = wx.getStorageSync('musicTherapyStatus') || '待启动';
    if (currentTherapyMode && currentTherapyMode.key === 'musicTherapy' && isRunning) {
      this.setData({
        isRunning: true,
        isPaused: isPaused,
        playStatus: playStatus
      });
    } else {
      this.setData({
        isRunning: false,
        isPaused: false,
        playStatus: '待启动'
      });
    }
  }
});