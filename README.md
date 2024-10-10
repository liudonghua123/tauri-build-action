# Tauri Build Action

[![GitHub Super-Linter](https://github.com/liudonghua123/tauri-build-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/liudonghua123/tauri-build-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/liudonghua123/tauri-build-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/liudonghua123/tauri-build-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/liudonghua123/tauri-build-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/liudonghua123/tauri-build-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This GitHub Action helps you build Tauri applications across different operating systems. It provides a streamlined way to set up, configure, and build Tauri projects using various templates and package managers.

## Inputs

The action supports the following inputs, which are defined in the `action.yml` file:

- `project_name`: The name of the project (default: `tauri-app`)
- `identifier`: The identifier for the project (default: `com.tauri-app.app`)
- `version`: The version for the project (default: `0.1.0`)
- `template`: The template to use for the project (default: `vanilla`)
- `manager`: The package manager to use (default: `npm`)
- `frontend_dist`: The frontend distribution directory (default: `../dist`)
- `output_dir`: The output directory of the Tauri build (default: `tauri-build`)
- `icon`: The icon for the project (optional)
- `tauri_conf_json`: Optional `tauri.conf.json` file overwrite (optional)
- `cargo_toml`: Optional `Cargo.toml` file overwrite (optional)
- `build_rs`: Optional `build.rs` file overwrite (optional)
- `lib_rs`: Optional `lib.rs` file overwrite (optional)
- `main_rs`: Optional `main.rs` file overwrite (optional)

## Example Workflow

Here is an example of how to use the action in a workflow:

```yaml
name: Tauri Build

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Tauri build
        id: tauri-build
        uses: liudonghua123/tauri-build-action@main
        with:
          project_name: ${{env.APP_NAME}}
          identifier: com.${{env.APP_NAME}}.app
          version: ${{ github.event.inputs.tag_version }}
          frontend_dist: ../dist
          icon: app-icon.png

      - name: Publish binary to release
        continue-on-error: true
        uses: softprops/action-gh-release@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          tag_name: ${{ github.event.inputs.tag_version }}
          files: tauri-build/*
          draft: false
          prerelease: false
```

## Build Steps and Prerequisites

### Linux

For Linux, the action installs the necessary dependencies and sets up the environment for cross-compiling to different architectures. The steps include:

1. Adding the necessary repositories and updating the package list.
2. Installing common dependencies.
3. Installing x86_64 dependencies.
4. Creating a `.cargo/config.toml` file for cross-compiling.
5. Installing i386, aarch64, and armhf dependencies.
6. Building for x86_64, i686, aarch64, and armv7 architectures.
7. Building for Android.

### macOS

For macOS, the action installs the necessary dependencies and sets up the environment for building Tauri applications. The steps include:

1. Installing the necessary prerequisites.
2. Initializing the iOS build environment.
3. Building for x86_64, aarch64, and universal architectures.
4. Building for iOS (currently commented out due to a signing issue).

### Windows

For Windows, the action installs the necessary dependencies and sets up the environment for building Tauri applications. The steps include:

1. Installing the necessary prerequisites.
2. Building for x86_64, i686, and aarch64 architectures.
