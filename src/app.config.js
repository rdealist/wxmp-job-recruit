export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/publish/index',
    'pages/user/index',
    'pages/detail/index',
    'pages/demo/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6697f5',
    navigationBarTitleText: '工程招聘',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f9fafb'
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#6697f5',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    custom: true,
    list: [
      {
        pagePath: 'pages/home/index',
        text: '招聘'
      },
      {
        pagePath: 'pages/publish/index',
        text: '发布'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的'
      }
    ]
  }
})
