#!/usr/bin/env node
'use strict';
const exec = require('child_process').exec;
const commander = require('commander');

const chalk = require('chalk');
const co = require('co');
const pkg = require('../package.json');
const utils = require('../lib/utils');

const CMD_CHECKOUT_MASTER = 'git checkout';
const CMD_PULL_MASTER = 'git pull origin';
const DESC_CREATE = 'input the name of your project, then it will generate a branch such as feature/{name}_{YYYY-MM-DD}_{TimeStamp}';
const DESC_DELETE = 'input the name of your project, branch feature/{name}_{YYYY-MM-DD}_{TimeStamp} will be removed and push a new tag which is tags/{name}_{YY-MM-DD}_{TimeStamp}';
const DESC_CLEAN = 'remove all local branch is not exist in remote branch anymore';

// create a formal branch
commander
  .version(pkg.version)
  .command('create [name]')
  .description(DESC_CREATE)
  .option('-m, --master [branch]', 'master branch name, master as default')
  .action((name, options) => {
    const MASTER_NAME = options.master || 'master';

    if (!name) {
      console.error(chalk.red(`[error]: lack of project name`));
      return;
    }

    utils.isCurrentBranch(MASTER_NAME)
      .then(isMaster => {
        const dateObj = utils.getFormatDateObj();
        const branchName = `feature/${name}_${dateObj.year}-${dateObj.month}-${dateObj.day}_${dateObj.timeStamp}`;
        let createBranchCmd = `git checkout -b ${branchName}`;
        let pushBranchCmd = `git push --set-upstream origin ${branchName}`;
        let cmdScript = `${createBranchCmd} && ${pushBranchCmd}`;

        if (!isMaster) {
          const warningCopy = `[warning] new project branch should be forked by branch '${chalk.bold(MASTER_NAME)}', auto checkout to ${MASTER_NAME} and pull latest code`;

          console.log(chalk.yellow(warningCopy));

          cmdScript = `${CMD_CHECKOUT_MASTER} ${MASTER_NAME} && ${CMD_PULL_MASTER} ${MASTER_NAME} && ${cmdScript}`;
        }

        exec(cmdScript, (...args) => {
          const err = args[0];
          const normalOutput = args[2];
          let output = err
            ? chalk.red(err)
            : chalk.yellow(normalOutput);

          console.log(output);
        });
      });
  });

// delete a formal branch
commander
  .command('delete [name]')
  .description(DESC_DELETE)
  .option('-m, --master [branch]', 'master branch name, master as default')
  .action((name, options) => {
    const MASTER_NAME = options.master || 'master';

    if (!name) {
      console.error(chalk.red(`[error]: lack of project name`));
      return;
    }

    const nameReg = new RegExp(`^feature/.*${name}.*_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]+$`);
    let cmdScript = `git branch`;

    const isBranchExist = new Promise((res, rej) => {
      exec(cmdScript, (...args) => {
        const err = args[0];
        const branches = args[1].replace(/\n\*?/g, '').split(' ').slice(1);
        const _branches = branches.filter(branch => nameReg.test(branch.trim()));

        if (err) {
          console.error(chalk.red(err));
          return rej(err);
        }

        res(_branches)
      });
    });

    isBranchExist
      .then(branches => {
        if (branches.length === 1) {
          const target = branches[0];

          utils.isCurrentBranch(target)
            .then(isCurrent => {
              let deleteBranchCmd = `git push -d origin ${target} && git branch -D ${target}`;

              if (isCurrent) {
                deleteBranchCmd = `${CMD_CHECKOUT_MASTER} ${MASTER_NAME} && ${deleteBranchCmd}`;
              }

              const dateObj = utils.getFormatDateObj();
              const matchNameReg = new RegExp(`^feature/(.*${name}.*)_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]+$`);
              const _name = target.match(matchNameReg)[1];
              let tagName = `tags/${_name}_${dateObj.year}-${dateObj.month}-${dateObj.day}_${dateObj.timeStamp}`;
              const createTagCmd = `git tag ${tagName} && git push origin ${tagName}`;

              const deletePromise = new Promise((res, rej) => {
                exec(deleteBranchCmd, err => {
                  if (err) {
                    rej(err);
                  }

                  res();
                });
              });

              deletePromise
                .then(function () {
                  exec(createTagCmd, (err) => {
                    if (err) {
                      Promise.reject(err);
                    }

                    console.log(chalk.yellow('delete branch and create a new tag'));
                  });
                })
                .catch(err => {
                  console.log(chalk.red(err.stack));
                });
            });

          return;
        }

        console.log(chalk.red('only one branch can be matched, please try again with a more accuracy project name.'))
      })
  });

// clean all branches is not exist in remote branch anymore
commander
  .command('clean')
  .description(DESC_CLEAN)
  .action(() => {
    let cmdScript = `git fetch --all -p; git branch -vv | grep ": gone]" | awk '{ print $1 }' | xargs -n 1 git branch -D`;

    const cmdResult = new Promise((res, rej) => {
      exec(cmdScript, err => {
        if (err) {
          rej(err);
        }

        res();
      });
    });

    cmdResult
      .then(() => {
        console.log(chalk.yellow('clean done'));
      })
      .catch((err) => {
        console.log(chalk.red(err.stack));
      });
  });


commander.parse(process.argv); // end with parse to parse through the input

if (commander.args.length === 0) commander.help();
