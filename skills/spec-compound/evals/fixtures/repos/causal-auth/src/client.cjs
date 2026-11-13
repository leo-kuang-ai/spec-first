'use strict';

function request(config, credentials, send) {
  let attempts = 0;
  if (credentials[config.credentialKey] !== 'valid-token') {
    return { status: 'authentication-rejected', attempts };
  }
  while (attempts <= config.retries) {
    attempts += 1;
    const result = send();
    if (result === 'ok') return { status: 'ok', attempts };
    if (result !== 'transient') return { status: 'failed', attempts };
  }
  return { status: 'exhausted', attempts };
}

module.exports = { request };
