const run = require('./run');


describe('with name input', () => {
  beforeAll(() => { process.env.INPUT_NAME = 'qwerty'; });

  test('get_input_or_pkg_attr', () => {
    return run.get_input_or_pkg_attr('name').then(data => {
      expect(data).toBe('qwerty');
    });
  });

  afterAll(() => { delete process.env.INPUT_NAME; });
})


describe('without name input', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("with-attrs"); });

  test('get_input_or_pkg_attr', () => {
    return run.get_input_or_pkg_attr('name').then(data => {
      expect(data).toBe('asdf');
    });
  });

  afterAll(() => { process.chdir(cwd); });
})


describe('with user input', () => {
  beforeAll(() => { process.env.INPUT_USER = 'fred'; });

  test('get_pkg_user', () => {
    return run.get_pkg_user().then(data => { expect(data).toBe('fred'); });
  });

  afterAll(() => { delete process.env.INPUT_USER; });
})


describe('with attr in conanfile', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("with-attrs"); });

  test('get_pkg_user', () => {
    return run.get_pkg_user().then(data => { expect(data).toBe('mike'); });
  });

  afterAll(() => { process.chdir(cwd); });
})


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
})


describe('with channel input', () => {
  beforeAll(() => { process.env.INPUT_CHANNEL = 'zxcv'; });

  test('get_pkg_channel', () => {
    return run.get_pkg_channel().then(data => { expect(data).toBe('zxcv'); });
  });

  afterAll(() => { delete process.env.INPUT_CHANNEL; });
})


describe('with attr in conanfile', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("with-attrs"); });

  test('get_pkg_channel', () => {
    return run.get_pkg_channel().then(data => { expect(data).toBe('chan'); });
  });

  afterAll(() => { process.chdir(cwd); });
})


describe('no channel input, no attr', () => {
  const cwd = process.cwd();
  beforeAll(() => { process.chdir("without-attrs"); });

  test('get_pkg_channel', () => {
    return run.get_pkg_channel().then(data => {
      expect(data).toBe('testing');
    });
  });

  afterAll(() => { process.chdir(cwd); });
})


describe('with reference input', () => {
  beforeAll(() => { process.env.INPUT_REFERENCE = 'foo/bar@baz/bah'; });

  test('get_pkg_reference', () => {
    return run.get_pkg_reference().then(data => {
      expect(data).toBe('foo/bar@baz/bah');
    });
  });

  afterAll(() => { delete process.env.INPUT_REFERENCE; });
})


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
})


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
})


test('get_target_user without target-user input', () => {
  expect(run.get_target_user('foo/bar@baz/bah')).toBe('baz');
});


describe('with default install input', () => {
  beforeAll(() => { process.env.INPUT_INSTALL = "latest"; });

  test('get_conan_version', () => {
    expect(run.get_conan_version()).toBe("conan");
  });

  afterAll(() => { delete process.env.INPUT_INSTALL; });
})


describe('with custon install input', () => {
  beforeAll(() => { process.env.INPUT_INSTALL = "1.20.0"; });

  test('get_conan_version', () => {
    expect(run.get_conan_version()).toBe("conan==1.20.0");
  });

  afterAll(() => { delete process.env.INPUT_INSTALL; });
})


describe('with disabled install', () => {
  beforeAll(() => { process.env.INPUT_INSTALL = "no"; });

  test('get_conan_version', () => {
    expect(run.get_conan_version()).toBe(null);
  });

  afterAll(() => { delete process.env.INPUT_INSTALL; });
})


describe('running', () => {
  const cwd = process.cwd();
  beforeAll(() => {
    process.env.INPUT_INSTALL = "no";
    process.env.INPUT_REFERENCE = "a/b@c/d";
    process.env["INPUT_TARGET-CHANNEL"] = "public";
  });

  let commands = [];
  const myexec = function(command, args) { commands.push([command, args]); };
  test('run() runs', () => {
    return run.run(myexec).then(() => {
      expect(commands).toStrictEqual([
        ['conan', ['copy', '--all', 'a/b@c/d', 'c/public']]
      ]);
    });
  });

  afterAll(() => {
    delete process.env["INPUT_TARGET-CHANNEL"];
    delete process.env.INPUT_REFERENCE;
    delete process.env.INPUT_INSTALL;
  });
});
