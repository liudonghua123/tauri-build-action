import { TauriBuild } from './tauri_build'
import * as core from '@actions/core'
import { execPromise } from './utils'

class TauriBuildWindows extends TauriBuild {
  os_label: string = 'windows'

  async install_prerequisites() {
    core.info('Installing prerequisites for Windows...')
    // Add Windows-specific installation according to https://tauri.app/start/prerequisites/#windows
  }

  async before_build() {
    core.info('Before building for Windows...')
  }

  async build() {
    core.info('Building for Windows...')
    await execPromise('rustup target add x86_64-pc-windows-msvc')
    await execPromise('rustup target add i686-pc-windows-msvc')
    await execPromise('rustup target add aarch64-pc-windows-msvc')
    await execPromise('npm run tauri -- info')
    // build for x86_64
    await execPromise('npm run tauri -- build -t x86_64-pc-windows-msvc')

    // build for i686
    await execPromise('npm run tauri -- build -t i686-pc-windows-msvc')

    // build for aarch64
    await execPromise('npm run tauri -- build -t aarch64-pc-windows-msvc')
  }

  async after_build() {
    core.info('After building for Windows...')
    const filesToCopy = [
      // x86_64
      {
        from: `src-tauri/target/x86_64-pc-windows-msvc/release/${this.projectName}.exe`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x64.exe`
      },
      {
        from: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/${this.projectName}_${this.version}_x64_en-US.msi`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x64_en-US.msi`
      },
      {
        from: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/${this.projectName}_${this.version}_x64-setup.exe`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x64-setup.exe`
      },
      // i686
      {
        from: `src-tauri/target/i686-pc-windows-msvc/release/${this.projectName}.exe`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x86.exe`
      },
      {
        from: `src-tauri/target/i686-pc-windows-msvc/release/bundle/msi/${this.projectName}_${this.version}_x86_en-US.msi`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x86_en-US.msi`
      },
      {
        from: `src-tauri/target/i686-pc-windows-msvc/release/bundle/nsis/${this.projectName}_${this.version}_x86-setup.exe`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x86-setup.exe`
      },
      // aarch64
      {
        from: `src-tauri/target/aarch64-pc-windows-msvc/release/${this.projectName}.exe`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_arm64.exe`
      },
      {
        from: `src-tauri/target/aarch64-pc-windows-msvc/release/bundle/msi/${this.projectName}_${this.version}_arm64_en-US.msi`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_arm64_en-US.msi`
      },
      {
        from: `src-tauri/target/aarch64-pc-windows-msvc/release/bundle/nsis/${this.projectName}_${this.version}_arm64-setup.exe`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_arm64-setup.exe`
      }
    ]
    for (const file of filesToCopy) {
      await execPromise(`cp ${file.from} ${file.to}`)
    }
  }
}

export { TauriBuildWindows }
