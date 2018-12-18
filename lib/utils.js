/**
 * @Desc
 * @Author leon <leondwong@gmail.com>
 * @Date 2017/9/29
 */
const exec = require('child_process').exec;

exports = module.exports;

exports.isCurrentBranch = function (target) {
  const currentBranchCmd = 'git rev-parse --abbrev-ref HEAD';

  return new Promise((res, rej) => {
    exec(currentBranchCmd, (...args) => {
      const err = args[0];
      const current = args[1];

      if (err) {
        console.error(chalk.red(err));
        return rej(err);
      }

      res(current.trim() === target)
    })
  })
};

exports.getFormatDateObj = (ts) => {
  const timeStamp = ts || Date.now();
  const date = new Date(timeStamp);
  const year = date.getFullYear();
  const month = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();

  return {
    year,
    month,
    day,
    timeStamp,
  }
};
