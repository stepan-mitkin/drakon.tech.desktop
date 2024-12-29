const package = require("./package")
const path = require('path')
const fs = require('fs').promises;
const child_process = require("child_process")

const rootFolder = "./"
const arch = "amd64"
const electron = "/home/builder/electron-v32.1.2-linux-x64"


async function main() {
    
    var folderName = package.name + "_" + package.version + "_" + arch
    var topFolder = path.join(rootFolder, folderName)
    console.log("Building package in", topFolder)

    var debian = path.join(topFolder, "DEBIAN")
    var usr = path.join(topFolder, "usr")
    var bin = path.join(usr, "bin")
    var share = path.join(usr, "share")
    var app = path.join(share, package.name)
    var apps = path.join(share, "applications")
    var appRes = path.join(app, "resources", "app")
    await fs.rm(topFolder, { recursive: true, force: true })
    await fs.mkdir(topFolder, { recursive: true })
    await fs.mkdir(usr)
    await fs.mkdir(debian)
    await fs.mkdir(bin)
    await fs.mkdir(share)
    await fs.mkdir(app)
    await fs.mkdir(apps)

    
    var launcher = [
        "#!/bin/bash",
        "/usr/share/" + package.name + "/" + package.name + " $1 --no-sandbox 1>/dev/null 2>&1 &"
    ]
    await fs.writeFile(path.join(bin, package.name), launcher.join("\n"))
    await fs.chmod(path.join(bin, package.name), 0o775)

    var control = [
        "Package: " + package.name,
        "Version: " + package.version,
        "Architecture: " + arch,
        "Maintainer: " + package.author,
        "Description: " + package.description,
        ""
    ]
    await fs.writeFile(path.join(debian, "control"), control.join("\n"))

    var desktop = [
        "[Desktop Entry]",
        "Name=" + package.name,
        "GenericName=" + package.name,
        "Exec=/usr/bin/" + package.name + " %U",
        "Terminal=false",
        "Icon=/usr/share/" + package.name + "/resources/app/drakosha.png",
        "Type=Application",
        "Categories=Application;Office;FlowChart;",
        "Comment=" + package.description,
        "StartupWMClass=" + package.name
    ]
    await fs.writeFile(path.join(apps, package.name + ".desktop"), desktop.join("\n"))

    await fs.cp(electron, app, {recursive: true})
    await fs.rm(path.join(app, "resources", "default_app.asar"))
    await fs.mkdir(appRes)

    var files = await fs.readdir(rootFolder)
    for (var file of files) {
        var filename = path.join(rootFolder, file)
        if (file != folderName && file != folderName + ".deb") {
            await fs.cp(filename, path.join(appRes, file), {recursive: true})
        }
    }    

    await fs.rename(path.join(app, "electron"), path.join(app, package.name))

    var command = "dpkg-deb -Zgzip --build --root-owner-group " + topFolder
    console.log(command)
    child_process.execSync(command)     
}


main()