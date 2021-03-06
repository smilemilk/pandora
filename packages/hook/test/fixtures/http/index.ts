'use strict';
import { RunUtil } from '../../RunUtil';
const assert = require('assert');
const { HttpPatcher } = require('../../../src/patch/http');
const httpPatcher = new HttpPatcher();

RunUtil.run(function(done) {
  httpPatcher.run();
  const http = require('http');
  const urllib = require('urllib');

  process.on('PANDORA_PROCESS_MESSAGE_TRACE', tracer => {
    assert(tracer.name === 'HTTP-GET:/');
    assert(tracer.spans.length > 0);
    assert(tracer.host);
    assert(tracer.ip);
    assert(tracer.pid);
    done();
  });

  const server = http.createServer((req, res) => {

    res.end('hello');
  });

  server.listen(0, () => {
    const port = server.address().port;

    setTimeout(function() {
      urllib.request(`http://localhost:${port}`);
    }, 500);
  });
});
