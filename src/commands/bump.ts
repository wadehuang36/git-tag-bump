import { exec } from "child_process";
import * as inquirer from "inquirer";
import * as semver from "semver";
import { CommandModule } from "yargs";


export let BumpCommand: CommandModule = {
    command: "$0",
    builder: (yargs) => {
        return yargs.option("part", {
            alias: "p",
            describe: "the part of version to increase",
            choices: ["major", "minor", "patch", "prerelease"]
        }).option("dry", {
            alias: "d",
            describe: "do not really update the version number",
            type: "boolean"
        })
    },
    describe: "bump the version number",
    handler: (argv) => {
        let version: string;
        fetchVersion()
            .then((v) => {
                version = v;
                if (argv.part != null) {
                    return argv
                }

                return inquirer.prompt({
                    type: 'list',
                    name: "part",
                    message: `Which part of version would you like to increase? (The current version is ${version})`,
                    choices: ['prerelease', 'patch', 'minor', 'major']
                })

            })
            .then((result) => {
                //TODO: make identifier configurable
                return semver.inc(version, result.part, false, 'beta')
            })
            .then((newVersion: string) => {
                version = newVersion
                if (argv.dry != true) {
                    return updateVersion(version)
                }
            })
            .then(() => {
                console.log(`update version to ${version}`);
            })
            .catch((err) => {
                console.error("bump failed", err);
            })
    }
}

function fetchVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
        // use version from git tags
        exec("git describe --tags --abbrev=0", function (err, stdout, stderr) {
            if (err) {
                // try again to return 0.0.0 if there is no tag
                exec("git tag --list", function (err2, stdout, stderr) {
                    if (err2) {
                        reject(err);
                        return;
                    }

                    if (stdout.trim() == "") {
                        resolve("0.0.0");
                    } else {
                        reject(err);
                    }
                });
            } else {
                let arr = stdout.split("/")
                let version = arr[arr.length - 1].trim();

                resolve(version);
            }
        });
    });
}

function updateVersion(version: string) {
    return new Promise((resolve, reject) => {
        // use version from git tags
        exec(`git tag ${version}`, function (err, stdout, stderr) {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}