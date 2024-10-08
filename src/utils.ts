import { exec } from 'child_process'
import * as core from '@actions/core'
/**
 * exec() wrapper that returns a Promise. Stream stdout and stderr to the parent process.
 * @param command The command to execute
 */
export async function execPromise(command: string) {
  return new Promise((resolve, reject) => {
    const command_process = exec(command)
    // Check and stream stdout to the parent process
    if (command_process.stdout) {
      command_process.stdout.pipe(process.stdout)
    }
    // Check and stream stderr to the parent process
    if (command_process.stderr) {
      command_process.stderr.pipe(process.stderr)
    }
    // Handle process completion
    command_process.on('close', code => {
      if (code === 0) {
        resolve(code) // Resolve if successful
      } else {
        reject(new Error(`Command failed with code ${code}`)) // Reject if there's an error
      }
    })
    // Handle errors in starting the process
    command_process.on('error', error => {
      reject(error)
    })
  })
}
