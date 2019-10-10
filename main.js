const core = require('@actions/core');
const exec = require('@actions/exec');


async function get_output(command, ...args) {
  let output = '';
  const opts = {
    listeners: { stdout: (data) => { output += data.toString(); } }
  };
  await exec.exec(command, args, opts);

  output = output.trim();
  return 'None' != output ? output : '' ;
}


async function inspect_pkg(attr) {
  return await get_output('conan', 'inspect', '.', '--raw', attr);
}


async function get_input_or_pkg_attr(attr) {
  let result = core.getInput(attr);
  if (!result) { result  = await inspect_pkg(attr); }
  return result;
}


async function get_pkg_user() {
  let result = core.getInput('user');

  if (!result) { result = (process.env['CONAN_USERNAME'] || '').trim(); }

  if (!result) { result = await inspect_pkg('default_user'); }

  if (!result) {
    const repo = process.env['GITHUB_REPOSITORY'] || '';
    result = (repo.split('/', 1) || [''])[0].trim();
  }

  return result;
}


async function get_pkg_channel() {
  let result = core.getInput('channel');

  if (!result) {
    const stable_channel
      = (process.env['CONAN_STABLE_CHANNEL'] || '').trim()
      || 'stable';
    const testing_channel
      = (process.env['CONAN_CHANNEL'] || '').trim()
      || (await inspect_pkg('default_channel'))
      || 'testing';

    const git_ref = process.env['GITHUB_REF'].split('/', 3)[2].trim();
    const stable_pattern
      = (process.env['CONAN_STABLE_BRANCH_PATTERN'] || '').trim()
      || '^(master$|release.*|stable.*)';

    result = git_ref.match(stable_pattern) ? stable_channel : testing_channel;
  }

  return result;
}


async function get_pkg_reference() {
  let result = core.getInput('reference');
  if (!result) {
    const name = await get_input_or_pkg_attr('name');
    const version = await get_input_or_pkg_attr('version');
    const user = await get_pkg_user();
    const channel = await get_pkg_channel();
    result = `${name}/${version}@${user}/${channel}`
  }
  return result;
}


async function get_target_user() {
  let result = core.getInput('target-user');
  if (!result) { result = await get_pkg_user(); }
  return result;
}


async function run() {
  const pkg_reference = await get_pkg_reference();
  console.log()
  console.log(`Using full package reference ${pkg_reference}`);

  const target_user = await get_target_user();
  const target_channel = core.getInput('target-channel');
  const target = `${target_user}/${target_channel}`;
  console.log()
  console.log(`Promoting to ${target}`);

  await exec.exec('conan', ['copy', '--all', pkg_reference, target]);
}

run()
