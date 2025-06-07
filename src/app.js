import { Component } from 'react'
import { JobProvider } from './stores/jobStore'
import './app.less'
import './styles/animations.less'
import './styles/taro-ui-custom.less'

class App extends Component {
  componentDidMount () {}

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  render () {
    return (
      <JobProvider>
        {this.props.children}
      </JobProvider>
    )
  }
}

export default App
