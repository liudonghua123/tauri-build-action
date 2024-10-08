import { TauriBuild } from './tauri_build'
import * as core from '@actions/core'
import { execPromise } from './utils'

class MacOSTauriBuild extends TauriBuild {
  install_prerequisites(): void {
    core.info('Installing prerequisites for MacOS...')
    // Add MacOS-specific installation according to https://tauri.app/start/prerequisites/#macos
  }

  before_build(): void {
    core.info('Before building for MacOS...')
    execPromise('npm install')
  }

  build(): void {
    core.info('Building for MacOS...')
    execPromise('npm run tauri build')
  }
}

export { MacOSTauriBuild }
