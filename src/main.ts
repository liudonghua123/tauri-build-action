import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import { execPromise, execPromiseOutput } from './utils'
import {
  TauriBuild,
  TauriBuildWindows,
  TauriBuildLinux,
  TauriBuildMacOS,
  TauriBuildOptions
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
    const version: string = core.getInput('version') || '0.1.0'
    const template: string = core.getInput('template') || 'vanilla'
    const manager: string = core.getInput('manager') || 'npm'
    const frontendDist: string = core.getInput('frontend_dist') || '../dist'
    const outputDir: string = core.getInput('output_dir') || 'tauri-build'
    const icon: string = core.getInput('icon')
    const tauriConfJson: string = core.getInput('tauri_conf_json')
    const cargoToml: string = core.getInput('cargo_toml')
    const buildRs: string = core.getInput('build_rs')
    const libRs: string = core.getInput('lib_rs')
    const mainRs: string = core.getInput('main_rs')

    const buildOptions: TauriBuildOptions = {
      projectName,
      identifier,
      version,
      template,
      manager,
      frontendDist,
      outputDir,
      icon,
      tauriConfJson,
      cargoToml,
      buildRs,
      libRs,
      mainRs
    }

    // Check the environment
    await checkEnviroment()

    // Run `npm create tauri-app` command with the new inputs
    await initialize(buildOptions)

    // Optional file overwrites
    await overwriteTauriFiles(buildOptions)

    // Build the Tauri app
    await build(buildOptions)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function checkEnviroment() {
  await execPromise(`node -v && npm -v`)
  await execPromise(`rustc --version && cargo --version`)
  // tauri android build requires JDK 17+
  await execPromise(`java -version`)
  // Exits if the JDK version is less than 17
  const jdkVersion = await execPromiseOutput(`java -version`)
  core.info(`JDK version: ${jdkVersion}`)
  const versionOutput = jdkVersion.split('\n')[0]
  const versionMatch = versionOutput.match(/version "(\d+)(\.\d+)?(\.\d+)?"/)
  if (!versionMatch) {
    return core.setFailed('Unable to detect JDK version.')
  }
  const majorVersion = parseInt(versionMatch[1], 10)
  if (majorVersion < 17) {
    return core.setFailed(
      `JDK version is ${majorVersion}, which is less than 17. Not meeting the minimum requirement of tauri.`
    )
  }
}

async function initialize({
  projectName,
  identifier,
  version,
  template,
  manager,
  frontendDist,
  outputDir,
  icon
}: TauriBuildOptions) {
  // Create the tauri project files via `npm create tauri-app`
  await execPromise(
    `npm create tauri-app ${projectName} -- --identifier ${identifier} --template ${template} --manager ${manager} --yes --force`
  )
  // copy package.json and src-tauri from projectName to the root of the project
  const projectPath = path.join(process.cwd(), projectName)
  const filesToCopy = ['package.json', 'src-tauri']
  for (const file of filesToCopy) {
    // skip if the file exists already
    if (fs.existsSync(path.join(process.cwd(), file))) {
      core.info(`Skipping ${file} as it already exists`)
      continue
    }
    core.info(
      `Copying ${file} generated via "npm create tauri-app" to the root of the project`
    )
    fs.cpSync(path.join(projectPath, file), path.join(process.cwd(), file), {
      recursive: true,
      force: true
    })
  }
  fs.rmSync(path.join(process.cwd(), projectName), {
    recursive: true,
    force: true
  })
  // Update `build.frontendDist` and `version` of `tauri.conf.json`
  const tauriConfPath = path.join(process.cwd(), 'src-tauri', 'tauri.conf.json')
  if (fs.existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'))
    tauriConf.build.frontendDist = frontendDist
    tauriConf.version = version
    core.info(
      `Updating tauri.conf.json with frontendDist: ${frontendDist}, version: ${version}`
    )
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2))
  }
  // install tauri dependencies
  await execPromise(`npm install`)
  // update icon if provided
  if (icon && fs.existsSync(icon)) {
    await execPromise(`npm run tauri -- icon ${icon}`)
  }
  // create output directory if it doesn't exist
  !fs.existsSync(outputDir) && fs.mkdirSync(outputDir)
}

async function build(buildOptions: TauriBuildOptions) {
  const platform = os.platform()
  let tauriBuild: TauriBuild

  if (platform === 'win32') {
    tauriBuild = new TauriBuildWindows(buildOptions)
  } else if (platform === 'linux') {
    tauriBuild = new TauriBuildLinux(buildOptions)
  } else if (platform === 'darwin') {
    tauriBuild = new TauriBuildMacOS(buildOptions)
  } else {
    throw new Error(`Unsupported platform: ${platform}`)
  }

  await tauriBuild.install_prerequisites()
  await tauriBuild.before_build()
  await tauriBuild.build()
  await tauriBuild.after_build()
}

async function overwriteTauriFiles({
  tauriConfJson,
  cargoToml,
  buildRs,
  libRs,
  mainRs
}: TauriBuildOptions) {
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
