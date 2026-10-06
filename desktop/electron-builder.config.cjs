/** @type {import("electron-builder").Configuration} */
module.exports = {
  appId: "in.webknot.webtrak",
  productName: "WebTrak",
  executableName: "webtrak",
  copyright: "© Webknot Technologies",
  directories: { output: "dist", buildResources: "build" },
  files: ["src/**/*", "package.json"],
  artifactName: "WebTrak-${version}-${os}-${arch}.${ext}",
  // The app is a thin window onto WebTrak, so nothing else needs to ship.
  asar: true,
  compression: "maximum",

  mac: {
    category: "public.app-category.business",
    icon: "build/icon.png",
    target: [{ target: "pkg", arch: ["universal"] }],
    // Unsigned until a Developer ID certificate is available (see README). Set CSC_LINK / CSC_KEY_PASSWORD and
    // remove `identity: null` to sign and notarise.
    identity: null,
  },
  pkg: {
    installLocation: "/Applications",
    allowAnywhere: true,
    allowCurrentUserHome: false,
    isRelocatable: false,
    isVersionChecked: false,
    scripts: "pkg-scripts",
    background: undefined,
  },

  win: {
    icon: "build/icon.png",
    target: [{ target: "nsis", arch: ["x64"] }],
    // Editing the .exe's resources needs Windows or Wine; the installer itself is unaffected.
    signAndEditExecutable: false,
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    runAfterFinish: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "WebTrak",
    deleteAppDataOnUninstall: false,
    uninstallDisplayName: "WebTrak",
  },

  linux: {
    category: "Office",
    icon: "build/icons",
    maintainer: "Webknot Technologies <it@webknot.in>",
    vendor: "Webknot Technologies",
    synopsis: "WebTrak for desktop",
    description: "WebTrak — leave, time, projects, meeting rooms and company updates in their own window.",
    target: [{ target: "deb", arch: ["x64", "arm64"] }],
    desktop: {
      entry: {
        Name: "WebTrak",
        Comment: "Workforce tracker",
        Categories: "Office;Network;",
        StartupWMClass: "WebTrak",
        Keywords: "leave;timesheet;attendance;webtrak;",
      },
    },
  },
  deb: {
    afterInstall: "build/deb/postinst.sh",
    afterRemove: "build/deb/postrm.sh",
    depends: ["libgtk-3-0", "libnotify4", "libnss3", "libxss1", "libxtst6", "xdg-utils", "libatspi2.0-0", "libuuid1", "libsecret-1-0"],
  },
};
