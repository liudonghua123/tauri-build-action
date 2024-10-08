import * as core from '@actions/core'
import { wait } from './wait'
import { exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    const projectName: string = core.getInput('project_name') || 'tauri-app'
    const identifier: string = core.getInput('identifier') || 'com.tauri-app.app'
    const template: string = core.getInput('template') || 'vanilla'
    const manager: string = core.getInput('manager') || 'npm'
    const frontendDist: string = core.getInput('frontend_dist') || '../dist'
    const tauriConfJson: string = core.getInput('tauri_conf_json')
    const cargoToml: string = core.getInput('cargo_toml')
    const buildRs: string = core.getInput('build_rs')
    const libRs: string = core.getInput('lib_rs')
    const mainRs: string = core.getInput('main_rs')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())

    // Run `npm create tauri-app` command with the new inputs
    await exec(`npm create tauri-app ${projectName} -- --identifier ${identifier} --template ${template} --manager ${manager} --yes --force`, (error, stdout, stderr) => {
      if (error) {
        core.setFailed(`Error creating tauri-app: ${error.message}`)
        return
      }
      core.debug(`stdout: ${stdout}`)
      core.debug(`stderr: ${stderr}`)

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

      // Optional file overwrites
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
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
