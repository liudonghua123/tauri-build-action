import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import { execPromise } from './utils'
import {
  TauriBuild,
  WindowsTauriBuild,
  LinuxTauriBuild,
  MacOSTauriBuild
} from './tauri_build'
import * as os from 'os'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const projectName: string = core.getInput('project_name') || 'tauri-app'
    const identifier: string =
      core.getInput('identifier') || 'com.tauri-app.app'
    const template: string = core.getInput('template') || 'vanilla'
    const manager: string = core.getInput('manager') || 'npm'
    const frontendDist: string = core.getInput('frontend_dist') || '../dist'
    const tauriConfJson: string = core.getInput('tauri_conf_json')
    const cargoToml: string = core.getInput('cargo_toml')
    const buildRs: string = core.getInput('build_rs')
    const libRs: string = core.getInput('lib_rs')
    const mainRs: string = core.getInput('main_rs')

    // Run `npm create tauri-app` command with the new inputs
    await initialize(projectName, identifier, template, manager, frontendDist)

    // Optional file overwrites
    await overwriteTauriFiles(tauriConfJson, cargoToml, buildRs, libRs, mainRs)

    // Build the Tauri app
    await build()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function initialize(
  projectName: string,
  identifier: string,
  template: string,
  manager: string,
  frontendDist: string
) {
  await execPromise(
    `npm create tauri-app ${projectName} -- --identifier ${identifier} --template ${template} --manager ${manager} --yes --force`
  )
  // Update `tauri.conf.json` with `frontend_dist`
  const tauriConfPath = path.join(projectName, 'src-tauri', 'tauri.conf.json')
  if (fs.existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'))
    tauriConf.build.frontendDist = frontendDist
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2))
  }

  // Move files from `project_name` to the current directory
  const projectPath = path.join(process.cwd(), projectName)
  fs.readdirSync(projectPath).forEach(file => {
    const srcPath = path.join(projectPath, file)
    const destPath = path.join(process.cwd(), file)
    fs.renameSync(srcPath, destPath)
  })
}

function build() {
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
  tauriBuild.before_build()
  tauriBuild.build()
}

function overwriteTauriFiles(
  tauriConfJson: string,
  cargoToml: string,
  buildRs: string,
  libRs: string,
  mainRs: string
) {
  if (tauriConfJson) {
    fs.writeFileSync(path.join('src-tauri', 'tauri.conf.json'), tauriConfJson)
  }
  if (cargoToml) {
    fs.writeFileSync('Cargo.toml', cargoToml)
  }
  if (buildRs) {
    fs.writeFileSync(path.join('src-tauri', 'build.rs'), buildRs)
  }
  if (libRs) {
    fs.writeFileSync(path.join('src-tauri', 'src', 'lib.rs'), libRs)
  }
  if (mainRs) {
    fs.writeFileSync(path.join('src-tauri', 'src', 'main.rs'), mainRs)
  }
}
