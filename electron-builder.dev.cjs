const packageJson = require('./package.json')

module.exports = {
  ...packageJson.build,
  appId: 'io.dsh.desktop.dev',
  productName: 'DSH Desktop Dev',
  directories: {
    ...packageJson.build.directories,
    output: 'dist-dev'
  },
  extraMetadata: {
    name: 'dsh-desktop-dev',
    productName: 'DSH Desktop Dev',
    // Linux reads this back as the window's app_id and the .desktop filename.
    // Sharing the production name would make a development build take over the
    // installed product's launcher entry.
    desktopName: 'dsh-desktop-dev.desktop',
    dshDesktopChannel: 'development'
  },
  artifactName: 'dsh-desktop-dev-${os}-${arch}.${ext}',
  nsis: {
    ...packageJson.build.nsis,
    artifactName: 'dsh-desktop-dev-windows-${arch}-setup.${ext}'
  },
  publish: null
}
