let Mocha = require('mocha'),
  should = require('should'),
  fs = require('fs'),
  debug = require('debug')('mocha:verify:multi'),
  async = require('async'),
  chalk = require('chalk');

let reporters = [
    'dot', 'doc', 'spec', 'json', 'progress',
    'list', 'tap', 'landing', 'xunit', 'min',
    'json-stream', 'markdown', 'nyan',
  ],
  now = new Date();

const reportersWithOptions = []
  .concat(reporters.map((reporter) => {
    const outFilename = tempName(`${reporter}-stdout`);
    const options = {};
    options[reporter] = {
      stdout: outFilename,
    };
    return {
      testName: `${reporter} (with options.stdout)`,
      outFilename,
      options,
    };
  }))
  .concat(reporters.map((reporter) => {
    const outFilename = tempName(`${reporter}-str`);
    const options = {};
    options[reporter] = outFilename;
    return {
      testName: `${reporter} (with options as string)`,
      outFilename,
      options,
    };
  }));


should(process.env.multi).not.be.ok;

function tempName(reporter) {
  return `/tmp/mocha-multi.${reporter}.${+now}`;
}

process.setMaxListeners(reportersWithOptions.length);

async.eachSeries(reportersWithOptions, (reporter, next) => {
  debug('reporter %s', reporter.testName);
  debug('reporterOptions %j', reporter.options);
  const mocha = new Mocha({
    ui: 'bdd',
    reporter: 'mocha-multi',
    reporterOptions: reporter.options,
  });
  mocha.addFile('test/dummy-spec.js');
  mocha.run(() => {
    debug('done running %j', reporter.testName);
    process.nextTick(next);
  });
}, () => {
  reportersWithOptions.forEach((reporter) => {
    fs.statSync.bind(fs, reporter.outFilename).should.not.throw();
    fs.unlinkSync(reporter.outFilename);
    console.log(chalk.green('%s OK'), reporter.testName);
  });
});
