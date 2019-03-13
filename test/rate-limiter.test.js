'use strict';

const mock = require('egg-mock');

describe('test/rate-limiter.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/rate-limiter-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, rateLimiter')
      .expect(200);
  });
});
