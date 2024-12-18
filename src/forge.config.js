module.exports = {
  packagerConfig: {
    icon: './drakosha',
    executableName: "drakontech"
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'Stepan Mitkin',
        description: 'A DRAKON-based IDE for JavaScript',
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './drakosha.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './drakosha.png'
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
