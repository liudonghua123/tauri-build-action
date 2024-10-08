export interface TauriBuildOptions {
  projectName: string
  identifier: string
  version: string
  template: string
  manager: string
  frontendDist: string
  outputDir: string
  icon?: string
  tauriConfJson?: string
  cargoToml?: string
  buildRs?: string
  libRs?: string
  mainRs?: string
}

abstract class TauriBuild {
  projectName: string
  identifier: string
  version: string
  outputDir: string
  os_label: string = 'unknown'

  constructor({
    projectName,
    identifier,
    version,
    outputDir
  }: TauriBuildOptions) {
    this.projectName = projectName
    this.identifier = identifier
    this.version = version
    this.outputDir = outputDir
  }

  abstract install_prerequisites(): void
  abstract before_build(): void
  abstract build(): void
  abstract after_build(): void
}

export { TauriBuild }
export { TauriBuildLinux } from './tauri_build_linux'
export { TauriBuildMacOS } from './tauri_build_macos'
export { TauriBuildWindows } from './tauri_build_windows'
