const run = require('./run');


describe('with name input', () => {
  beforeAll(() => { process.env.INPUT_NAME = 'qwerty'; });

  test('get_input_or_pkg_attr', () => {
    return run.get_input_or_pkg_attr('name').then(data => {
      expect(data).toBe('qwerty');
    });
  });

  afterAll(() => { delete process.env.INPUT_NAME; });
});


describe('without name input', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("with-attrs"); });

  test('get_input_or_pkg_attr', () => {
    return run.get_input_or_pkg_attr('name').then(data => {
      expect(data).toBe('asdf');
    });
  });

  afterAll(() => { process.chdir(cwd); });
});


describe('with user input', () => {
  beforeAll(() => { process.env.INPUT_USER = 'fred'; });

  test('get_pkg_user', () => {
    return run.get_pkg_user().then(data => { expect(data).toBe('fred'); });
  });

  afterAll(() => { delete process.env.INPUT_USER; });
});


describe('with attr in conanfile', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("with-attrs"); });

  test('get_pkg_user', () => {
    return run.get_pkg_user().then(data => { expect(data).toBe('mike'); });
  });

  afterAll(() => { process.chdir(cwd); });
});


describe('no user input, no attr', () => {
  const cwd = process.cwd();
  beforeAll(() => {
    process.env.GITHUB_REPOSITORY = 'foobar/bazbar';
    process.chdir("without-attrs");
  });

  test('get_pkg_user', () => {
    return run.get_pkg_user().then(data => { expect(data).toBe('foobar'); });
  });

  afterAll(() => {
    process.chdir(cwd);
    delete process.env.GITHUB_REPOSITORY;
  });
});


describe('with channel input', () => {
  beforeAll(() => { process.env.INPUT_CHANNEL = 'zxcv'; });

  test('get_pkg_channel', () => {
    return run.get_pkg_channel().then(data => { expect(data).toBe('zxcv'); });
  });

  afterAll(() => { delete process.env.INPUT_CHANNEL; });
});


describe('with attr in conanfile', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("with-attrs"); });

  test('get_pkg_channel', () => {
    return run.get_pkg_channel().then(data => { expect(data).toBe('chan'); });
  });

  afterAll(() => { process.chdir(cwd); });
});


describe('no channel input, no attr', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("without-attrs"); });

  test('get_pkg_channel', () => {
    return run.get_pkg_channel().then(data => {
      expect(data).toBe('testing');
    });
  });

  afterAll(() => { process.chdir(cwd); });
});


describe('with reference input', () => {
  beforeAll(() => { process.env.INPUT_REFERENCE = 'foo/bar@baz/bah'; });

  test('get_pkg_reference', () => {
    return run.get_pkg_reference().then(data => {
      expect(data).toBe('foo/bar@baz/bah');
    });
  });

  afterAll(() => { delete process.env.INPUT_REFERENCE; });
});


describe('without reference input', () => {
  beforeAll(() => {
    process.env.INPUT_NAME = 'a';
    process.env.INPUT_VERSION = 'b';
    process.env.INPUT_USER = 'c';
    process.env.INPUT_CHANNEL = 'd';
  });

  test('get_pkg_reference', () => {
    return run.get_pkg_reference().then(data => {
      expect(data).toBe('a/b@c/d');
    });
  });

  afterAll(() => {
    delete process.env.INPUT_CHANNEL;
    delete process.env.INPUT_USER;
    delete process.env.INPUT_VERSION;
    delete process.env.INPUT_NAME;
  });
});


test('user from reference', () => {
  expect(run.user_from_reference('xyz/1.2.3@jane/stable')).toBe('jane');
  expect(run.user_from_reference('')).toBe('');
});


describe('with target-user input', () => {
  beforeAll(() => { process.env['INPUT_TARGET-USER'] = 'joe'; });

  test('get_target_user', () => {
    expect(run.get_target_user('foo/bar@baz/bah')).toBe('joe');
  });

  afterAll(() => { delete process.env['INPUT_TARGET-USER']; });
});


test('get_target_user without target-user input', () => {
  expect(run.get_target_user('foo/bar@baz/bah')).toBe('baz');
});


describe('with default install input', () => {
  beforeAll(() => { process.env.INPUT_INSTALL = 'latest'; });

  test('get_conan_version', () => {
    expect(run.get_conan_version()).toBe('conan');
  });

  afterAll(() => { delete process.env.INPUT_INSTALL; });
});


describe('with custon install input', () => {
  beforeAll(() => { process.env.INPUT_INSTALL = '1.20.0'; });

  test('get_conan_version', () => {
    expect(run.get_conan_version()).toBe('conan==1.20.0');
  });

  afterAll(() => { delete process.env.INPUT_INSTALL; });
});


describe('with disabled install', () => {
  beforeAll(() => { process.env.INPUT_INSTALL = 'no'; });

  test('get_conan_version', () => {
    expect(run.get_conan_version()).toBe(null);
  });

  afterAll(() => { delete process.env.INPUT_INSTALL; });
})


describe('with remote input', () => {
  beforeAll(() => { process.env.INPUT_REMOTE = 'foobar'; });

  test('get_remote_name', () => {
    expect(run.get_remote_name()).toBe('foobar');
  });

  afterAll(() => { delete process.env.INPUT_REMOTE; });
});


describe('with CONAN_UPLOAD with remote name part', () => {
  beforeAll(() => { process.env.CONAN_UPLOAD = 'https://foo.bar@True@xxyy'; });

  test('get_remote_name', () => {
    expect(run.get_remote_name()).toBe('xxyy');
  });

  afterAll(() => { delete process.env.CONAN_UPLOAD; });
});


describe('with CONAN_UPLOAD without remote name part', () => {
  beforeAll(() => { process.env.CONAN_UPLOAD = 'https://foo.bar@True'; });

  test('get_remote_name', () => {
    expect(run.get_remote_name()).toBe('upload');
  });

  afterAll(() => { delete process.env.CONAN_UPLOAD; });
});


test('get_remote_name without remote input', () => {
  expect(run.get_remote_name()).toBe('upload');
});


describe('with url input', () => {
  beforeAll(() => { process.env.INPUT_URL = 'https://example.com'; });

  test('get_remote_url', () => {
    expect(run.get_remote_url()).toBe('https://example.com');
  });

  afterAll(() => { delete process.env.INPUT_URL; });
});


describe('with CONAN_UPLOAD', () => {
  beforeAll(() => { process.env.CONAN_UPLOAD = 'https://foobar.com'; });

  test('get_remote_url', () => {
    expect(run.get_remote_url()).toBe('https://foobar.com');
  });

  afterAll(() => { delete process.env.CONAN_UPLOAD; });
});


describe('with CONAN_UPLOAD with several parts', () => {
  beforeAll(() => { process.env.CONAN_UPLOAD = 'https://foobar.com@True@n'; });

  test('get_remote_url', () => {
    expect(run.get_remote_url()).toBe('https://foobar.com');
  });

  afterAll(() => { delete process.env.CONAN_UPLOAD; });
});


test('get_remote_url() empty by default', () => {
  expect(run.get_remote_url()).toBe('');
});


describe('adding a remote', () => {
  beforeAll(() => { process.env.CONAN_UPLOAD = 'https://foo.bar@True@baz'; });

  {
    let commands = [];
    const myexec = function(command, args) { commands.push([command, args]); };
    test('get_remote() adds a remote', () => {
      return run.get_remote(myexec).then(name => {
        expect(name).toBe('baz');
        expect(commands).toStrictEqual([
          ['conan', ['remote', 'add', 'baz', 'https://foo.bar']]
        ]);
      });
    });
  }

  {
    let commands = [];
    const myexec = function(command, args) {
      commands.push([command, args]);
      throw Error("no way");
    };
    test('get_remote() is fault-tolerant', () => {
      return run.get_remote(myexec).then(name => {
        expect(name).toBe('baz');
        expect(commands).toStrictEqual([
          ['conan', ['remote', 'add', 'baz', 'https://foo.bar']]
        ]);
      });
    });
  }

  afterAll(() => { delete process.env.CONAN_UPLOAD; });
});


test('make_target_reference()', () => {
  expect(run.make_target_reference('a/b@c/d', 'q/w')).toBe('a/b@q/w');
});


describe('with login input', () => {
  beforeAll(() => { process.env.INPUT_LOGIN = 'jimmy'; });

  test('get_login_user', () => {
    expect(run.get_login_user('mark')).toBe('jimmy');
  });

  afterAll(() => { delete process.env.INPUT_LOGIN; });
});


describe('with CONAN_LOGIN_USERNAME envar', () => {
  beforeAll(() => { process.env.CONAN_LOGIN_USERNAME = 'billy'; });

  test('get_login_user', () => {
    expect(run.get_login_user('mark')).toBe('billy');
  });

  afterAll(() => { delete process.env.CONAN_LOGIN_USERNAME; });
});


test('get_login_user default', () => {
  expect(run.get_login_user('mark')).toBe('mark');
});


describe('with password input', () => {
  beforeAll(() => { process.env.INPUT_PASSWORD = 'topsekret'; });

  test('get_password', () => {
    expect(run.get_password()).toBe('topsekret');
  });

  afterAll(() => { delete process.env.INPUT_PASSWORD; });
});


describe('with CONAN_PASSWORD envar', () => {
  beforeAll(() => { process.env.CONAN_PASSWORD = 'mypassword'; });

  test('get_password', () => {
    expect(run.get_password()).toBe('mypassword');
  });

  afterAll(() => { delete process.env.CONAN_PASSWORD; });
});


describe('full run', () => {
  beforeAll(() => {
    process.env.INPUT_INSTALL = 'latest';
    process.env.INPUT_REFERENCE = 'a/b@c/d';
    process.env.CONAN_UPLOAD = 'https://example.com';
    process.env['INPUT_TARGET-CHANNEL'] = 'public';
    process.env.INPUT_PASSWORD = '1';
  });

  let commands = [];
  const myexec = function(command, args) { commands.push([command, args]); };
  test('run() runs', () => {
    return run.run(myexec).then(() => {
      expect(commands).toStrictEqual(
        [ ['pip', ['install', 'conan']]
        , ['conan', ['remote', 'add', 'upload', 'https://example.com']]
        , ['conan', ['download', '-r', 'upload', 'a/b@c/d']]
        , ['conan', ['copy', '--all', 'a/b@c/d', 'c/public']]
        , ['conan', ['user', '-p', '1', '-r', 'upload', 'c']]
        , ['conan', ['upload', '-c', '--all', '-r', 'upload', 'a/b@c/public']]
        ]);
    });
  });

  afterAll(() => {
    delete process.env.INPUT_PASSWORD;
    delete process.env['INPUT_TARGET-CHANNEL'];
    delete process.env.INPUT_UPLOAD;
    delete process.env.INPUT_REFERENCE;
    delete process.env.INPUT_INSTALL;
  });
});
