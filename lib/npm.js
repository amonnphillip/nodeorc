const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const PACKAGE_NAME = 'package.json';

class nodeorcNpm {
  createNpmPackageFileIfNone(packagePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(path.resolve(packagePath + '/' + PACKAGE_NAME))) {
        let cmd = exec('npm init --y', {cwd: packagePath}, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve(true);
            }
          }
        );

        cmd.stdout.on('data', (out) => {
          console.log(out);
        });
        cmd.stderr.on('data', (out) => {
          console.log(out);
        })
      } else {
        resolve(true);
      }
    });
  }

  install(packages, packagePath) {
    return new Promise((resolve, reject) => {
      if (typeof packages === 'undefined' ||
      packages.length === 0) {
        reject('No packages found');
      }
      if (typeof packages === 'string') {
        packages = [packages];
      }

      let cmdString = 'npm install ' + packages.join(' ') + ' --save';

      let cmd = exec(cmdString, {cwd: packagePath}, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        }
      );

      cmd.stdout.on('data', (out) => {
        console.log(out);
      });
      cmd.stderr.on('data', (out) => {
        console.log(out);
      })
    });
  }
}

module.exports = nodeorcNpm;