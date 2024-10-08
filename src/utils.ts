import { exec } from 'child_process'
import * as core from '@actions/core'

/**
 * Execute a command and stream stdout and stderr to the parent process.
 * @param command The command to execute
 * @returns The exit code of the command or an error if the command failed
 */
export async function execPromise(command: string) {
  return new Promise((resolve, reject) => {
    core.info(`Running command: ${command}`)
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

/**
 * Execute a command and return the output as a Promise.
 * @param command The command to execute
 * @returns The output of the command or an error if the command failed
 */
export async function execPromiseOutput(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    core.info(`Running command: ${command}`)
    const command_process = exec(command)
    let stdout = ''
    let stderr = ''
    // Check and stream stdout to the parent process
    if (command_process.stdout) {
      command_process.stdout.on('data', data => {
        stdout += data
        process.stdout.write(data)
      })
    }
    // Check and stream stderr to the parent process
    if (command_process.stderr) {
      command_process.stderr.on('data', data => {
        stderr += data
        process.stderr.write(data)
      })
    }
    // Handle process completion
    command_process.on('close', code => {
      if (code === 0) {
        // Combined stdout and stderr handling: If stdout is empty, return stderr as a fallback. This is important because some commands output critical information in stderr (like java -version).
        resolve(stdout.trim() || stderr.trim()) // Return stdout if available, otherwise stderr
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr.trim()}`)) // Include stderr in error
      }
    })
    // Handle errors in starting the process
    command_process.on('error', error => {
      reject(error)
    })
  })
}
