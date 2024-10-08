import { TauriBuild } from './tauri_build'
import * as core from '@actions/core'
import { execPromise } from './utils'

class LinuxTauriBuild extends TauriBuild {
  install_prerequisites(): void {
    core.info('Installing prerequisites for Linux...')
    // Add Linux-specific installation according to https://tauri.app/start/prerequisites/#linux
    execPromise(
      'sudo apt update -y && sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev'
    )
  }

  before_build(): void {
    core.info('Before building for Linux...')
    execPromise('npm install')
  }

  build(): void {
    core.info('Building for Linux...')
    execPromise('npm run tauri build')
  }
}

export { LinuxTauriBuild }
