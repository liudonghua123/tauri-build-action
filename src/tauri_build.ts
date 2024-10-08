abstract class TauriBuild {
  projectName: string
  identifier: string
  version: string
  os_label: string = 'unknown'

  constructor(projectName: string, identifier: string, version: string) {
    this.projectName = projectName
    this.identifier = identifier
    this.version = version
  }

  abstract install_prerequisites(): void
  abstract before_build(): void
  abstract build(): void
  abstract after_build(): void
}

export { TauriBuild }
export { LinuxTauriBuild } from './tauri_build_linux'
export { MacOSTauriBuild } from './tauri_build_macos'
export { WindowsTauriBuild } from './tauri_build_windows'
