const path = require('path');
const exec = require('child_process').exec;

const gulp = require('gulp');
const replace = require('gulp-replace');
const inquirer = require('inquirer');
const semver = require('semver');

let currentVersion; // cached version

gulp.task('build-project', function (callback) {
    exec(`tsc -p tsconfig.prod.json`, function (err, stdout, stderr) {
        if (err) {
            callback(err);
            return;
        }

        gulp.src([`./package*.json`, `./README.md`])
            .pipe(gulp.dest(`./build/`))
            .on("error", callback)
            .on("end", callback);
    });
});

gulp.task("update-package.json", function (callback) {
    fetchVersion()
        .then((version) => {
            gulp.src("./package*.json")
                .pipe(replace("0.0.0-PLACEHOLDER", version))
                .pipe(replace("./build/", "./"))
                .pipe(gulp.dest("./build"))
                .on("error", callback)
                .on("end", callback);

        })
        .catch(callback);
});

gulp.task("increase-version", function (callback) {
    let version;
    fetchVersion()
        .then((v) => {
            version = v;
            return inquirer.prompt({
                type: 'list',
                name: "part",
                message: `Which part of version would you like to increase? (The current version is ${version})`,
                choices: ['none', 'prerelease', 'patch', 'minor', 'major']
            })

        })
        .then((result) => {
            if (result.part != "none") {
                return semver.inc(version, result.part, 'beta')
            }
        })
        .then((newVersion) => {
            if (newVersion) {
                return updateVersion(newVersion)
            }
        })
        .then(callback)
        .catch(callback)
});

gulp.task("install-cli", function (callback) {
    exec(`cd ./build/ && npm pack && npm install -g git-tag-bump-0.0.0-PLACEHOLDER.tgz`, callback);
});

gulp.task('build', gulp.series(["increase-version", "build-project", "update-package.json"]));

gulp.task('local', gulp.series(["build-project", "install-cli"]));

function fetchVersion() {
    return new Promise((resolve, reject) => {
        if (currentVersion) {
            return resolve(currentVersion)
        }

        // use version from git tags
        exec("git describe --tags --abbrev=0", function (err, stdout, stderr) {
            if (err) {
                reject(err);
                return;
            }

            let arr = stdout.split("/")
            currentVersion = arr[arr.length - 1];
            resolve(currentVersion)
        });
    })
}

function updateVersion(version) {
    return new Promise((resolve, reject) => {
        // use version from git tags
        exec(`git tag ${version}`, function (err, stdout, stderr) {
            if (err) {
                reject(err);
                return;
            }

            console.log(`update version to ${version}`)
            currentVersion = version;

            resolve()
        });
    })
}