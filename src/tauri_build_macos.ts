import { TauriBuild } from './tauri_build'
import * as core from '@actions/core'
import { execPromise } from './utils'

class TauriBuildMacOS extends TauriBuild {
  os_label: string = 'macos'

  async install_prerequisites() {
    core.info('Installing prerequisites for MacOS...')
    // Add MacOS-specific installation according to https://tauri.app/start/prerequisites/#macos
  }

  async before_build() {
    core.info('Before building for MacOS...')
    await execPromise('npm run tauri -- ios init')
  }

  async build() {
    core.info('Building for MacOS...')
    await execPromise('rustup target add x86_64-apple-darwin')
    await execPromise('rustup target add aarch64-apple-darwin')
    await execPromise('npm run tauri -- info')
    // build for x86_64
    await execPromise('npm run tauri -- build -t x86_64-apple-darwin')

    // build for aaarch64
    await execPromise('npm run tauri -- build -t aarch64-apple-darwin')

    // build for universal
    await execPromise('npm run tauri -- build -t universal-apple-darwin')

    // build for ipa
    // https://tauri.app/distribute/app-store/#ios
    // TODO: Need to fix error: Signing for "tauri-app_iOS" requires a development team. Select a development team in the Signing & Capabilities editor.
    // await execPromise(
    //   'npm run tauri -- ios build --export-method app-store-connect'
    // )
  }

  async after_build() {
    core.info('After building for MacOS...')
    const filesToCopy = [
      // x86_64
      {
        from: `src-tauri/target/x86_64-apple-darwin/release/${this.projectName}`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x64`
      },
      {
        from: `src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/${this.projectName}_${this.version}_x64.dmg`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_x64.dmg`
      },
      // aarch64
      {
        from: `src-tauri/target/aarch64-apple-darwin/release/${this.projectName}`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_aarch64`
      },
      {
        from: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/${this.projectName}_${this.version}_aarch64.dmg`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_aarch64.dmg`
      },
      // universal
      {
        from: `src-tauri/target/universal-apple-darwin/release/${this.projectName}`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_universal`
      },
      {
        from: `src-tauri/target/universal-apple-darwin/release/bundle/dmg/${this.projectName}_${this.version}_universal.dmg`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_universal.dmg`
      }
      // ipa
      // {
      //   from: `src-tauri/gen/apple/build/arm64/${this.projectName}.ipa`,
      //   to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}.ipa`
      // }
    ]
    for (const file of filesToCopy) {
      await execPromise(`cp ${file.from} ${file.to}`)
    }
  }
}

export { TauriBuildMacOS }
