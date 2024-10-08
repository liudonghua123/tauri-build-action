import { TauriBuild } from './tauri_build'
import * as core from '@actions/core'
import { execPromise } from './utils'

class LinuxTauriBuild extends TauriBuild {
  os_label: string = 'linux'

  async install_prerequisites() {
    core.info('Installing prerequisites for Linux...')
    // Add Linux-specific installation according to https://tauri.app/start/prerequisites/#linux
    await execPromise(`codename=$(lsb_release -cs) && sudo tee /etc/apt/sources.list << EOF
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename main multiverse universe restricted
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename-security main multiverse universe restricted
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename-updates main multiverse universe restricted
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename-backports main multiverse universe restricted

deb [arch-=amd64,i386] http://ports.ubuntu.com/ubuntu-ports $codename main multiverse universe restricted
deb [arch-=amd64,i386] http://ports.ubuntu.com/ubuntu-ports $codename-security main multiverse universe restricted
deb [arch-=amd64,i386] http://ports.ubuntu.com/ubuntu-ports $codename-updates main multiverse universe restricted
deb [arch-=amd64,i386] http://ports.ubuntu.com/ubuntu-ports $codename-backports main multiverse universe restricted
EOF`)
    await execPromise(
      'sudo dpkg --add-architecture i386 && sudo dpkg --add-architecture arm64 && sudo dpkg --add-architecture armhf && sudo apt update -y'
    )
    await execPromise('sudo apt install -y gcc-multilib g++-multilib')
    await execPromise(
      'sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev'
    )
    // install i386 dependencies, libayatana-appindicator3-dev:i386 is missing, see https://packages.ubuntu.com/noble/libayatana-appindicator3-dev
    await execPromise(
      'sudo apt install -y libwebkit2gtk-4.1-dev:i386 libssl-dev:i386 librsvg2-dev:i386 libsoup-3.0-dev:i386'
    )
    // install aarch64 dependencies
    await execPromise(
      'sudo apt install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu libc6-dev-arm64-cross patchelf:arm64 libwebkit2gtk-4.1-dev:arm64 libssl-dev:arm64 librsvg2-dev:arm64 libayatana-appindicator3-dev:arm64 libsoup-3.0-dev:arm64'
    )
    // install armhf dependencies
    await execPromise(
      'sudo apt install -y gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf libc6-dev-armhf-cross patchelf:armhf libwebkit2gtk-4.1-dev:armhf libssl-dev:armhf librsvg2-dev:armhf libayatana-appindicator3-dev:armhf libsoup-3.0-dev:armhf'
    )
  }

  async before_build() {
    core.info('Before building for Linux...')
    await execPromise('npm install')
  }

  async build() {
    core.info('Building for Linux...')
    await execPromise('rustup target add x86_64-unknown-linux-gnu')
    await execPromise('rustup target add i686-unknown-linux-gnu')
    await execPromise('rustup target add aarch64-unknown-linux-gnu')
    await execPromise('rustup target add armv7-unknown-linux-gnueabihf')
    await execPromise('npm run tauri -- info')
    // build for x86_64
    await execPromise('npm run tauri -- build -t x86_64-unknown-linux-gnu')

    // build for i686
    await execPromise(
      'export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig/:$PKG_CONFIG_PATH'
    )
    await execPromise('export PKG_CONFIG_SYSROOT_DIR=/')
    await execPromise('npm run tauri -- build -t i686-unknown-linux-gnu')

    // build for aarch64
    await execPromise('export PKG_CONFIG_SYSROOT_DIR=/usr/aarch64-linux-gnu/')
    await execPromise(
      'npm run tauri -- build -t aarch64-unknown-linux-gnu -b deb'
    )

    // build for armv7
    await execPromise('export PKG_CONFIG_SYSROOT_DIR=/usr/arm-linux-gnueabihf/')
    await execPromise(
      'npm run tauri -- build -t armv7-unknown-linux-gnueabihf -b deb'
    )
  }

  async after_build() {
    core.info('After building for Linux...')
    const outputDir = 'tauri-builds'
    await execPromise(`mkdir ${outputDir}`)
    const filesToCopy = [
      // x86_64
      {
        from: `src-tauri/target/x86_64-unknown-${this.os_label}-gnu/release/${this.projectName}`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_amd64`
      },
      {
        from: `src-tauri/target/x86_64-unknown-${this.os_label}-gnu/release/bundle/appimage/${this.projectName}_${this.version}_amd64.AppImage`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_amd64.AppImage`
      },
      {
        from: `src-tauri/target/x86_64-unknown-${this.os_label}-gnu/release/bundle/deb/${this.projectName}_${this.version}_amd64.deb`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_amd64.deb`
      },
      // i686
      {
        from: `src-tauri/target/i686-unknown-${this.os_label}-gnu/release/${this.projectName}`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_i386`
      },
      {
        from: `src-tauri/target/i686-unknown-${this.os_label}-gnu/release/bundle/appimage/${this.projectName}_${this.version}_i386.AppImage`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_i386.AppImage`
      },
      {
        from: `src-tauri/target/i686-unknown-${this.os_label}-gnu/release/bundle/deb/${this.projectName}_${this.version}_i386.deb`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_i386.deb`
      },
      // aarch64
      {
        from: `src-tauri/target/aarch64-unknown-${this.os_label}-gnu/release/${this.projectName}`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_arm64`
      },
      {
        from: `src-tauri/target/aarch64-unknown-${this.os_label}-gnu/release/bundle/deb/${this.projectName}_${this.version}_arm64.deb`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_arm64.deb`
      },
      // armv7
      {
        from: `src-tauri/target/aarch64-unknown-${this.os_label}-gnu/release/${this.projectName}`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_armhf`
      },
      {
        from: `src-tauri/target/aarch64-unknown-${this.os_label}-gnu/release/bundle/deb/${this.projectName}_${this.version}_armhf.deb`,
        to: `${outputDir}/${this.projectName}-${this.os_label}-${this.version}_armhf.deb`
      }
    ]
    for (const file of filesToCopy) {
      await execPromise(`cp ${file.from} ${file.to}`)
    }
  }
}

export { LinuxTauriBuild }
