/**
 * The entrypoint for the action.
 */
import { run } from './main'
import { TauriBuild, WindowsTauriBuild, LinuxTauriBuild, MacOSTauriBuild } from './tauri_build'
import * as os from 'os'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()

const platform = os.platform()
let tauriBuild: TauriBuild

if (platform === 'win32') {
  tauriBuild = new WindowsTauriBuild()
} else if (platform === 'linux') {
  tauriBuild = new LinuxTauriBuild()
} else if (platform === 'darwin') {
  tauriBuild = new MacOSTauriBuild()
} else {
  throw new Error(`Unsupported platform: ${platform}`)
}

tauriBuild.install_prerequisites()
tauriBuild.build()
