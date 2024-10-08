import { TauriBuild } from './tauri_build'
import * as core from '@actions/core'
import { execPromise } from './utils'

class WindowsTauriBuild extends TauriBuild {
  install_prerequisites(): void {
    core.info('Installing prerequisites for Windows...')
    // Add Windows-specific installation according to https://tauri.app/start/prerequisites/#windows
  }

  before_build(): void {
    core.info('Before building for Windows...')
    execPromise('npm install')
  }

  build(): void {
    core.info('Building for Windows...')
    execPromise('npm run tauri build')
  }
}

export { WindowsTauriBuild }
