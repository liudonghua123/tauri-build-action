import { TauriBuild } from './tauri_build'

class LinuxTauriBuild extends TauriBuild {
  install_prerequisites(): void {
    console.log('Installing prerequisites for Linux...')
    // Add Linux-specific installation logic here
  }

  build(): void {
    console.log('Building for Linux...')
    // Add Linux-specific build logic here
  }
}

export { LinuxTauriBuild }
