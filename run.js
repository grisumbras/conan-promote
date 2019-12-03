const core = require('@actions/core');
const exec = require('@actions/exec');


function get_env(name) { return (process.env[name] || '').trim(); }

function user_from_reference(reference) {
  reference = reference || '';
  reference = reference.split('@', 2)
  if (reference.length < 2) { reference = ['', '']; }
  return reference[1].trim().split('/', 1)[0].trim();
}

function get_target_user(reference) {
  let result = core.getInput('target-user');
  if (!result) { result = user_from_reference(reference); }
  return result;
}

function get_conan_version() {
  const version = core.getInput('install');
  let result = "conan";
  if ("no" == version) {
    return null;
  } if ("latest" != version) {
    result = `${result}==${version}`;
  }
  return result;
};

async function get_output(command, ...args) {
  let output = '';
  const opts =
    { listeners: { stdout: (data) => { output += data.toString(); } }
    , silent: true
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

  if (!result) { result = get_env('CONAN_USERNAME'); }

  if (!result) { result = await inspect_pkg('default_user'); }

  if (!result) {
    const repo = get_env('GITHUB_REPOSITORY');
    result = (repo.split('/', 1) || [ '' ])[0].trim();
  }

  return result;
}

async function get_pkg_channel() {
  let result = core.getInput('channel');

  if (!result) { result = get_env('CONAN_CHANNEL'); }

  if (!result) { result = await inspect_pkg('default_channel'); }

  if (!result) { result = 'testing'; }

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

async function run(execute) {
  const pkg_reference = await get_pkg_reference();
  console.log(`Using full package reference ${pkg_reference}`);

  const target_user = await get_target_user(pkg_reference);
  const target_channel = core.getInput('target-channel');
  const target = `${target_user}/${target_channel}`;
  console.log(`Promoting to ${target}`);

  if (!execute) { execute = exec.exec; }
  await execute('conan', ['copy', '--all', pkg_reference, target]);
}


module.exports =
  { get_input_or_pkg_attr: get_input_or_pkg_attr
  , get_pkg_user: get_pkg_user
  , get_pkg_channel: get_pkg_channel
  , get_pkg_reference: get_pkg_reference
  , user_from_reference: user_from_reference
  , get_target_user: get_target_user
  , get_conan_version: get_conan_version
  , run: run
  };
