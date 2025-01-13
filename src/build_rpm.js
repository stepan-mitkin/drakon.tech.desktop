const package = require("./package")
const path = require('path')
const fs = require('fs').promises;
const child_process = require("child_process")

const rootFolder = "./"
const arch = "x86_64"
const electron = "/home/builder/electron-v32.1.2-linux-x64"

async function main() {
    
    var folderName = "package"
    var topFolder = path.join(rootFolder, folderName)
    console.log("Building package in", topFolder)

    var rpmbuild = "/home/stipan/rpmbuild"
    var packageFile = package.name + "-" + package.version + "-1." + arch
    var buildRoot = path.join(rpmbuild, "BUILDROOT", packageFile)
    // var specs = path.join(topFolder, "SPECS")
    // var rpms = path.join(topFolder, "RPMS")
    var usr = path.join(buildRoot, "usr")
    var bin = path.join(usr, "bin")
    var share = path.join(usr, "share")
    var app = path.join(share, package.name)
    var apps = path.join(share, "applications")
    var appRes = path.join(app, "resources", "app")
    await fs.rm(rpmbuild, { recursive: true, force: true })
    await fs.mkdir(buildRoot, { recursive: true })
    await fs.mkdir(usr)    
    await fs.mkdir(bin)
    await fs.mkdir(share)
    await fs.mkdir(app)
    await fs.mkdir(apps)

    
    var launcher = [
        "#!/bin/bash",
        "/usr/share/" + package.name + "/" + package.name + " $1 $2 --no-sandbox 1>/dev/null 2>&1 &"
    ]
    await fs.writeFile(path.join(bin, package.name), launcher.join("\n"))
    await fs.chmod(path.join(bin, package.name), 0o775)

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
        if (file != folderName && file != folderName + ".deb" && file != "prompts") {
            await fs.cp(filename, path.join(appRes, file), {recursive: true})
        }
    }    

    await fs.rename(path.join(app, "electron"), path.join(app, package.name))

    var spec = [
        "Name: " + package.name,
        "Version: " + package.version,
        "Release: 1",
        "License: " + package.license, 
        "Summary: " + package.description,
        "URL: " + package.url,
        "",
        "%description",
        package.description,
        "%files"
    ]
    await scanFolder(spec, "", buildRoot)
    spec.push("")
    await fs.writeFile(path.join("./", package.name + ".spec"), spec.join("\n"))

    var command = "rpmbuild --target x86_64 -bb " + package.name + ".spec"
    console.log(command)
    child_process.execSync(command)     
}

async function isDirectory(path) {
    const stats = await fs.stat(path)
    const result = stats.isDirectory()
    return result
}

async function scanFolder(output, prev, prevPath) {
    var files = await fs.readdir(prevPath)
    for (var file of files) {
        var fullName = path.join(prevPath, file)
        var shortName = prev + "/" + file
        var dir = await isDirectory(fullName)
        if (dir) {
            await scanFolder(output, shortName, fullName)
        } else {
            output.push(shortName)
        }
    }
}

function isOnBlackList(filename) {
    if (filename === "bin") { return true }
    if (filename === "usr") { return true }
    if (filename === "share") { return true }
    if (filename === "applications") { return true }

    return false
}


main()