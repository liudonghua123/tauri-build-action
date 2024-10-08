abstract class TauriBuild {
  abstract install_prerequisites(): void
  abstract before_build(): void
  abstract build(): void
}

export { TauriBuild }
export { WindowsTauriBuild } from './windows_tauri_build'
export { LinuxTauriBuild } from './linux_tauri_build'
export { MacOSTauriBuild } from './macos_tauri_build'
