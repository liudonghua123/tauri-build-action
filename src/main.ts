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
import { exec } from 'child_process'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const projectName: string = core.getInput('project_name') || 'tauri-app'
    const identifier: string =
      core.getInput('identifier') || 'com.tauri-app.app'
    const version: string = core.getInput('version') || '0.1.0'
    const template: string = core.getInput('template') || 'vanilla'
    const manager: string = core.getInput('manager') || 'npm'
    const frontendDist: string = core.getInput('frontend_dist') || '../dist'
    const icon: string = core.getInput('icon')
    const tauriConfJson: string = core.getInput('tauri_conf_json')
    const cargoToml: string = core.getInput('cargo_toml')
    const buildRs: string = core.getInput('build_rs')
    const libRs: string = core.getInput('lib_rs')
    const mainRs: string = core.getInput('main_rs')

    // Run `npm create tauri-app` command with the new inputs
    await initialize(
      projectName,
      identifier,
      version,
      template,
      manager,
      frontendDist,
      icon
    )

    // Optional file overwrites
    await overwriteTauriFiles(tauriConfJson, cargoToml, buildRs, libRs, mainRs)

    // Build the Tauri app
    await build(projectName, identifier, version)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function initialize(
  projectName: string,
  identifier: string,
  version: string,
  template: string,
  manager: string,
  frontendDist: string,
  icon: string
) {
  // Create the tauri project files via `npm create tauri-app`
  await execPromise(
    `npm create tauri-app ${projectName} -- --identifier ${identifier} --template ${template} --manager ${manager} --yes --force`
  )
  // Update `build.frontendDist` and `version` of `tauri.conf.json`
  const tauriConfPath = path.join(projectName, 'src-tauri', 'tauri.conf.json')
  if (fs.existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'))
    tauriConf.build.frontendDist = frontendDist
    tauriConf.version = version
    core.info(
      `Updating tauri.conf.json with frontendDist: ${frontendDist}, version: ${version}`
    )
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2))
  }
  // copy package.json and src-tauri from projectName to the root of the project
  const projectPath = path.join(process.cwd(), projectName)
  const filesToCopy = ['package.json', 'src-tauri']
  for (const file of filesToCopy) {
    fs.cpSync(path.join(projectPath, file), path.join(process.cwd(), file), {
      recursive: true
    })
  }
  fs.rmSync(path.join(process.cwd(), projectName), {
    recursive: true,
    force: true
  })
  // update icon if provided
  if (icon && fs.existsSync(icon)) {
    await execPromise(`npm run tauri -- icon ${icon}`)
  }
}

async function build(projectName: string, identifier: string, version: string) {
  const platform = os.platform()
  let tauriBuild: TauriBuild

  if (platform === 'win32') {
    tauriBuild = new WindowsTauriBuild(projectName, identifier, version)
  } else if (platform === 'linux') {
    tauriBuild = new LinuxTauriBuild(projectName, identifier, version)
  } else if (platform === 'darwin') {
    tauriBuild = new MacOSTauriBuild(projectName, identifier, version)
  } else {
    throw new Error(`Unsupported platform: ${platform}`)
  }

  await tauriBuild.install_prerequisites()
  await tauriBuild.before_build()
  await tauriBuild.build()
}

async function overwriteTauriFiles(
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
