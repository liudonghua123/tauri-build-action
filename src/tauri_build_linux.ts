import { TauriBuild } from './tauri_build'
import * as core from '@actions/core'
import { execPromise } from './utils'

class TauriBuildLinux extends TauriBuild {
  os_label: string = 'linux'

  async install_prerequisites() {
    core.info('Installing prerequisites for Linux...')
    // Add Linux-specific installation according to https://tauri.app/start/prerequisites/#linux
    await execPromise(`codename=$(lsb_release -cs) && sudo tee /etc/apt/sources.list << EOF
# Main repositories for amd64 and i386
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename main restricted universe multiverse
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename-updates main restricted universe multiverse
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename-security main restricted universe multiverse
deb [arch=amd64,i386] http://archive.ubuntu.com/ubuntu $codename-backports main restricted universe multiverse

# Ports repositories for arm64 and armhf
deb [arch=arm64,armhf] http://ports.ubuntu.com/ubuntu-ports $codename main restricted universe multiverse
deb [arch=arm64,armhf] http://ports.ubuntu.com/ubuntu-ports $codename-updates main restricted universe multiverse
deb [arch=arm64,armhf] http://ports.ubuntu.com/ubuntu-ports $codename-security main restricted universe multiverse
deb [arch=arm64,armhf] http://ports.ubuntu.com/ubuntu-ports $codename-backports main restricted universe multiverse
EOF`)
    await execPromise(
      'sudo cat /etc/apt/sources.list && sudo ls -la /etc/apt/sources.list.d && sudo cat /etc/apt/sources.list.d/* && sudo rm -rf /etc/apt/sources.list.d/* /var/lib/apt/lists/* /var/cache/apt/archives/* || true'
    )
    await execPromise(
      'sudo dpkg --add-architecture i386 && sudo dpkg --add-architecture arm64 && sudo dpkg --add-architecture armhf && sudo apt clean -y && sudo apt autoclean -y && sudo apt update -y'
    )
    // install common dependencies
    await execPromise(
      'sudo apt install -y build-essential curl wget file gcc-multilib g++-multilib'
    )

    // install x86_64 dependencies
    await execPromise(
      'sudo apt install -y libwebkit2gtk-4.1-dev libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev'
    )

    // create .cargo/config.toml file for cross-compiling
    await execPromise(`mkdir -p .cargo`)
    await execPromise(`cat > .cargo/config.toml << EOF
[target.armv7-unknown-linux-gnueabihf]
linker = "arm-linux-gnueabihf-gcc"

[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
EOF`)
  }

  async before_build() {
    core.info('Before building for Linux...')
    // https://v2.tauri.app/distribute/google-play/#build-apks:~:text=By%20default%20the%20generated%20AAB%20and%20APK%20is%20universal
    // https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md#environment-variables-2:~:text=sdk/ndk/27.1.12297006-,ANDROID_NDK_HOME,-/usr/local/lib
    await execPromise(
      'export NDK_HOME=$ANDROID_NDK_HOME && npm run tauri -- android init'
    )
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

    // install i386 dependencies, libayatana-appindicator3-dev:i386, libxdo-dev:i386 is missing, see https://packages.ubuntu.com/noble/libayatana-appindicator3-dev, https://packages.ubuntu.com/noble/libxdo-dev
    await execPromise(
      'sudo apt install -y libwebkit2gtk-4.1-dev:i386 libssl-dev:i386 librsvg2-dev:i386 libsoup-3.0-dev:i386'
    )
    await execPromise(`ls -la /usr /usr/lib /usr/lib/i386-linux-gnu`)
    // build for i686
    await execPromise(
      'export PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/lib/i386-linux-gnu/pkgconfig/ && export PKG_CONFIG_SYSROOT_DIR=/usr/i386-linux-gnu/ && npm run tauri -- build -t i686-unknown-linux-gnu'
    )

    // install aarch64 dependencies
    await execPromise(
      'sudo apt install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu libc6-dev-arm64-cross patchelf:arm64 libwebkit2gtk-4.1-dev:arm64 libxdo-dev:arm64 libssl-dev:arm64 libayatana-appindicator3-dev:arm64 librsvg2-dev:arm64 libsoup-3.0-dev:arm64'
    )
    await execPromise(`ls -la /usr /usr/lib /usr/lib/aarch64-linux-gnu`)
    // build for aarch64, skip appimage due to Error failed to bundle project: error running build_appimage.sh: `failed to run /home/runner/work/tauri-build-action/tauri-build-action/src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/appimage/build_appimage.sh`
    // see also https://v2.tauri.app/distribute/appimage/#appimages-for-arm-based-devices.
    await execPromise(
      'export PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/lib/aarch64-linux-gnu/pkgconfig/ && export PKG_CONFIG_SYSROOT_DIR=/usr/aarch64-linux-gnu/ && npm run tauri -- build -t aarch64-unknown-linux-gnu -b deb,rpm'
    )

    // install armhf dependencies
    await execPromise(
      'sudo apt install -y gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf libc6-dev-armhf-cross patchelf:armhf libwebkit2gtk-4.1-dev:armhf libxdo-dev:armhf libssl-dev:armhf libayatana-appindicator3-dev:armhf librsvg2-dev:armhf libsoup-3.0-dev:armhf'
    )
    await execPromise(`ls -la /usr /usr/lib /usr/lib/arm-linux-gnueabihf`)
    // build for armv7, skip appimage as mentioned above
    await execPromise(
      'export PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/lib/arm-linux-gnueabihf/pkgconfig/ && export PKG_CONFIG_SYSROOT_DIR=/usr/arm-linux-gnueabihf/ && npm run tauri -- build -t armv7-unknown-linux-gnueabihf -b deb,rpm'
    )
  }

  async after_build() {
    core.info('After building for Linux...')
    let filesToCopy = [
      // x86_64
      {
        from: `src-tauri/target/x86_64-unknown-linux-gnu/release/${this.projectName}`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_amd64`
      },
      {
        from: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/${this.projectName}_${this.version}_amd64.AppImage`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_amd64.AppImage`
      },
      {
        from: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/${this.projectName}_${this.version}_amd64.deb`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_amd64.deb`
      },
      {
        from: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/rpm/${this.projectName}-${this.version}-1.x86_64.rpm`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}.x86_64.rpm`
      },
      // i686
      {
        from: `src-tauri/target/i686-unknown-linux-gnu/release/${this.projectName}`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_i386`
      },
      {
        from: `src-tauri/target/i686-unknown-linux-gnu/release/bundle/appimage/${this.projectName}_${this.version}_i386.AppImage`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_i386.AppImage`
      },
      {
        from: `src-tauri/target/i686-unknown-linux-gnu/release/bundle/deb/${this.projectName}_${this.version}_i386.deb`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_i386.deb`
      },
      {
        from: `src-tauri/target/i686-unknown-linux-gnu/release/bundle/rpm/${this.projectName}-${this.version}-1.i386.rpm`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}.i386.rpm`
      },
      // aarch64
      {
        from: `src-tauri/target/aarch64-unknown-linux-gnu/release/${this.projectName}`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_arm64`
      },
      {
        from: `src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/deb/${this.projectName}_${this.version}_arm64.deb`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_arm64.deb`
      },
      {
        from: `src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/rpm/${this.projectName}-${this.version}-1.aarch64.rpm`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}.aarch64.rpm`
      },
      // armv7
      {
        from: `src-tauri/target/armv7-unknown-linux-gnueabihf/release/${this.projectName}`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_armhf`
      },
      {
        from: `src-tauri/target/armv7-unknown-linux-gnueabihf/release/bundle/deb/${this.projectName}_${this.version}_armhf.deb`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}_armhf.deb`
      },
      {
        from: `src-tauri/target/armv7-unknown-linux-gnueabihf/release/bundle/rpm/${this.projectName}-${this.version}-1.armhfp.rpm`,
        to: `${this.outputDir}/${this.projectName}-${this.os_label}-${this.version}.armhfp.rpm`
      }
    ]
    for (const file of filesToCopy) {
      await execPromise(`cp ${file.from} ${file.to}`)
    }
    // Build for android after cleanup target directory
    await execPromise('rm -rf src-tauri/target')
    // build for android
    // https://tauri.app/distribute/google-play/#build-apks
    await execPromise(
      'export NDK_HOME=$ANDROID_NDK_HOME && npm run tauri -- android build'
    )
    filesToCopy = [
      // android
      {
        from: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`,
        to: `${this.outputDir}/${this.projectName}-android-${this.version}-universal-release-unsigned.apk`
      },
      {
        from: `src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab`,
        to: `${this.outputDir}/${this.projectName}-android-${this.version}-universal-release.aab`
      }
    ]
    for (const file of filesToCopy) {
      await execPromise(`cp ${file.from} ${file.to}`)
    }
  }
}

export { TauriBuildLinux }
