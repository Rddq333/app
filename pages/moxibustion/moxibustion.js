const api = require('../../utils/api');
Page({
  data: {
    status: '未启动',
    temp: 50,
    time: 20,
    timeOptions: [10, 15, 20, 25, 30],
    part: '背部',
    partOptions: ['背部', '腰部', '腿部'],
    intensity: '中',
    intensityOptions: ['低', '中', '高'],
    mode: '温灸',
    modeOptions: ['温灸', '热灸']
  },
  onTempChange(e) {
    this.setData({ temp: e.detail.value });
  },
  onTimeChange(e) {
    this.setData({ time: this.data.timeOptions[e.detail.value] });
  },
  onPartChange(e) {
    this.setData({ part: this.data.partOptions[e.detail.value] });
  },
  onIntensityChange(e) {
    this.setData({ intensity: this.data.intensityOptions[e.detail.value] });
  },
  onModeChange(e) {
    this.setData({ mode: this.data.modeOptions[e.detail.value] });
  },
  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route !== 'pages/index/index') {
      wx.navigateBack();
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },
  startMoxibustion() {
    api.controlMoxibustion({
      action: 'start',
      temp: this.data.temp,
      time: this.data.time,
      part: this.data.part,
      intensity: this.data.intensity,
      mode: this.data.mode
    }).then(() => {
      this.setData({ status: '运行中' });
    });
  },
  stopMoxibustion() {
    api.controlMoxibustion({ action: 'stop' }).then(() => {
      this.setData({ status: '已停止' });
    });
  }
}); 