export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/publish/index', 
    'pages/user/index',
    'pages/detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6697f5',
    navigationBarTitleText: '工程招聘',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#6697f5',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png',
        text: '招聘'
      },
      {
        pagePath: 'pages/publish/index',
        iconPath: 'assets/icons/publish.png',
        selectedIconPath: 'assets/icons/publish-active.png',
        text: '发布'
      },
      {
        pagePath: 'pages/user/index',
        iconPath: 'assets/icons/user.png',
        selectedIconPath: 'assets/icons/user-active.png',
        text: '我的'
      }
    ]
  }
})
