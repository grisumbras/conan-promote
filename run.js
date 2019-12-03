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
  return core.getInput('target-user') || user_from_reference(reference);
}

function get_remote_part(index) {
  return get_env('CONAN_UPLOAD').split('@', 3)[index];
}

function get_remote_name() {
  return core.getInput('remote') || get_remote_part(2) || 'upload';
}

function get_remote_url() {
  return core.getInput('url') || get_remote_part(0);
}

function make_target_reference(src_ref, target_ns) {
  src_ref = src_ref || '';
  src_ref = src_ref.split('@', 2)
  if (src_ref.length < 2) { src_ref = ['', '']; }
  return `${src_ref[0].trim()}@${target_ns}`;
}

function get_login_user(user) {
  return core.getInput('login') || get_env('CONAN_LOGIN_USERNAME') || user;
}

function get_password() {
  return core.getInput('password') || get_env('CONAN_PASSWORD');
}

function get_conan_version() {
  const version = core.getInput('install');
  let result = 'conan';
  if ('no' == version) {
    return null;
  } if ('latest' != version) {
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

async function get_remote(execute) {
  const name = get_remote_name();
  const url = get_remote_url();
  if (!name || !url) { return ""; }

  try {
    await execute('conan', ['remote', 'add', name, url]);
  } catch (e) {
    console.log(
      `Failed adding Conan remote ${name}, assume it already exists...`
    );
  }

  return name;
}

async function authenticate(execute, remote, user) {
  const login = get_login_user(user);
  if (!login) {
    console.log('No login username, skipping upload...');
    return;
  }

  const password = get_password(user);
  if (!password) {
    console.log('No password, skipping upload...');
    return;
  }

  console.log(`Authenticating with remote '${remote}' as ${login}...`);
  await execute('conan', ['user', '-p', password, '-r', remote, login]);

  return true;
}

async function run(execute) {
  if (!execute) { execute = exec.exec; }

  const conan_version = get_conan_version();
  if (conan_version) {
    console.log(`Installing ${conan_version}...`)
    await execute('pip', ["install", conan_version]);
  }

  const src_reference = await get_pkg_reference();
  console.log(`Source package reference ${src_reference}`);

  // potentially adds the remote
  const remote = await get_remote(execute);
  // download source packages from the remote
  if (remote) {
    await execute('conan', ['download', '-r', remote, src_reference]);
  }

  const target_user = await get_target_user(src_reference);
  const target_channel = core.getInput('target-channel');
  const target = `${target_user}/${target_channel}`;
  console.log(`Promoting to ${target}...`);

  // do the package promotion
  await execute('conan', ['copy', '--all', src_reference, target]);

  // upload new packages back
  if (remote && await authenticate(execute, remote, target_user)) {
    const tgt_reference = make_target_reference(src_reference, target);
    console.log(`Uploading packages ${tgt_reference} to ${remote}...`);
    await execute(
      'conan', ['upload', '-c', '--all', '-r', remote, tgt_reference]
    );
  }
}


module.exports =
  { get_input_or_pkg_attr: get_input_or_pkg_attr
  , get_pkg_user: get_pkg_user
  , get_pkg_channel: get_pkg_channel
  , get_pkg_reference: get_pkg_reference
  , user_from_reference: user_from_reference
  , get_target_user: get_target_user
  , get_conan_version: get_conan_version
  , get_remote_name: get_remote_name
  , get_remote_url: get_remote_url
  , get_remote: get_remote
  , make_target_reference: make_target_reference
  , get_login_user: get_login_user
  , get_password: get_password
  , run: run
  };
