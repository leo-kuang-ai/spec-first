const { requireTty } = require('./tty');

class PromptCancelled extends Error {
  constructor(message = 'Prompt cancelled.') {
    super(message);
    this.name = 'PromptCancelled';
    this.code = 'prompt_cancelled';
  }
}

function select(question, options, promptOptions = {}) {
  const normalizedOptions = normalizeOptions(options);
  if (normalizedOptions.length === 0) {
    return Promise.reject(new Error('select requires at least one option.'));
  }

  let selectedIndex = promptOptions.requireExplicit
    ? -1
    : clampIndex(promptOptions.defaultIndex, normalizedOptions.length);

  return runPrompt(promptOptions, (text, resolve, reject, redraw) => {
    if (containsCancel(text)) {
      reject(new PromptCancelled());
      return;
    }
    if (text.includes('\x1b[A')) {
      selectedIndex = selectedIndex < 0
        ? normalizedOptions.length - 1
        : selectedIndex <= 0 ? normalizedOptions.length - 1 : selectedIndex - 1;
      redraw();
      return;
    }
    if (text.includes('\x1b[B')) {
      selectedIndex = selectedIndex < 0
        ? 0
        : selectedIndex >= normalizedOptions.length - 1 ? 0 : selectedIndex + 1;
      redraw();
      return;
    }
    if (text.includes('\r') || text.includes('\n')) {
      if (selectedIndex < 0) {
        redraw();
        return;
      }
      resolve(normalizedOptions[selectedIndex].value);
    }
  }, () => renderSelect(question, normalizedOptions, selectedIndex, promptOptions));
}

function checkbox(question, options, promptOptions = {}) {
  const normalizedOptions = normalizeOptions(options);
  if (normalizedOptions.length === 0) {
    return Promise.reject(new Error('checkbox requires at least one option.'));
  }

  let selectedIndex = clampIndex(promptOptions.defaultIndex, normalizedOptions.length);
  const checkedIndexes = new Set();
  normalizedOptions.forEach((option, index) => {
    if (option.checked) {
      checkedIndexes.add(index);
    }
  });

  let errorMessage = '';
  const clearError = () => {
    errorMessage = '';
  };

  return runPrompt(promptOptions, (text, resolve, reject, redraw) => {
    if (containsCancel(text)) {
      reject(new PromptCancelled());
      return;
    }
    if (text.includes('\x1b[A')) {
      clearError();
      selectedIndex = selectedIndex <= 0 ? normalizedOptions.length - 1 : selectedIndex - 1;
      redraw();
      return;
    }
    if (text.includes('\x1b[B')) {
      clearError();
      selectedIndex = selectedIndex >= normalizedOptions.length - 1 ? 0 : selectedIndex + 1;
      redraw();
      return;
    }
    if (text.includes(' ')) {
      clearError();
      if (checkedIndexes.has(selectedIndex)) {
        checkedIndexes.delete(selectedIndex);
      } else {
        checkedIndexes.add(selectedIndex);
      }
      redraw();
      return;
    }
    if (text.includes('\r') || text.includes('\n')) {
      if (checkedIndexes.size < (promptOptions.minSelected || 0)) {
        errorMessage = typeof promptOptions.onMinError === 'function'
          ? promptOptions.onMinError(promptOptions.minSelected)
          : `Select at least ${promptOptions.minSelected}.`;
        redraw();
        return;
      }
      resolve(normalizedOptions
        .filter((_option, index) => checkedIndexes.has(index))
        .map((option) => option.value));
    }
  }, () => renderCheckbox(question, normalizedOptions, selectedIndex, checkedIndexes, promptOptions, errorMessage));
}

function textInput(question, promptOptions = {}) {
  let value = '';
  const defaultValue = typeof promptOptions.default === 'string' ? promptOptions.default : '';

  return runPrompt(promptOptions, (text, resolve, reject, redraw) => {
    if (containsCancel(text)) {
      reject(new PromptCancelled());
      return;
    }
    if (isEscapeSequenceToken(text)) {
      redraw();
      return;
    }
    for (const char of text) {
      if (char === '\r' || char === '\n') {
        const finalValue = value.length > 0 ? value : defaultValue;
        if (typeof promptOptions.validate === 'function') {
          const validation = promptOptions.validate(finalValue);
          if (validation !== true) {
            write(promptOptions.output, `\n${validation || 'Invalid value.'}\n`);
            redraw();
            return;
          }
        }
        resolve(finalValue);
        return;
      }
      if (char === '\b' || char === '\x7f') {
        value = value.slice(0, -1);
        continue;
      }
      if (char >= ' ' && char !== '\x1b') {
        value += char;
      }
    }
    redraw();
  }, () => renderTextInput(question, value, defaultValue, promptOptions));
}

function confirm(question, promptOptions = {}) {
  const defaultValue = promptOptions.default !== false;

  return runPrompt(promptOptions, (text, resolve, reject, redraw) => {
    if (containsCancel(text)) {
      reject(new PromptCancelled());
      return;
    }

    const normalized = text.trim().toLowerCase();
    if (text.includes('\r') || text.includes('\n')) {
      resolve(defaultValue);
      return;
    }
    if (normalized === 'y' || normalized === 'yes') {
      resolve(true);
      return;
    }
    if (normalized === 'n' || normalized === 'no') {
      resolve(false);
      return;
    }
    redraw();
  }, () => renderConfirm(question, defaultValue, promptOptions));
}

function runPrompt(promptOptions, handleInput, render) {
  const input = promptOptions.input || process.stdin;
  const output = promptOptions.output || process.stdout;

  return new Promise((resolve, reject) => {
    let settled = false;
    let rawModeEnabled = false;
    let inputResumed = false;
    let lastRender = null;

    const redraw = () => {
      clearRenderedPrompt(output, lastRender);
      lastRender = render() || null;
    };

    const cleanup = () => {
      input.off('data', onData);
      input.off('end', onEnd);
      process.off('SIGTERM', onSignal);
      process.off('SIGHUP', onSignal);
      process.off('exit', onExit);
      if (rawModeEnabled && typeof input.setRawMode === 'function') {
        input.setRawMode(false);
      }
      if (inputResumed && typeof input.pause === 'function') {
        input.pause();
      }
      write(output, '\x1b[?25h');
    };

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      write(output, '\n');
      fn(value);
    };

    function onData(chunk) {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      for (const token of tokenizeInput(text)) {
        if (settled) return;
        handleInput(
          token,
          (value) => settle(resolve, value),
          (error) => settle(reject, error),
          redraw,
        );
      }
    }

    function onEnd() {
      settle(reject, new PromptCancelled('Prompt input closed.'));
    }

    function onSignal() {
      settle(reject, new PromptCancelled('Prompt interrupted.'));
    }

    function onExit() {
      if (rawModeEnabled && typeof input.setRawMode === 'function') {
        input.setRawMode(false);
      }
      if (inputResumed && typeof input.pause === 'function') {
        input.pause();
      }
      write(output, '\x1b[?25h');
    }

    if (typeof input.setRawMode === 'function') {
      input.setRawMode(true);
      rawModeEnabled = true;
    }
    if (typeof input.resume === 'function') {
      input.resume();
      inputResumed = true;
    }
    input.on('data', onData);
    input.on('end', onEnd);
    process.once('SIGTERM', onSignal);
    process.once('SIGHUP', onSignal);
    process.once('exit', onExit);
    write(output, '\x1b[?25l');
    redraw();
  });
}

function renderSelect(question, options, selectedIndex, promptOptions) {
  const output = promptOptions.output || process.stdout;
  write(output, `${question}\n`);
  options.forEach((option, index) => {
    write(output, `${index === selectedIndex ? '>' : ' '} ${option.label}\n`);
  });
  if (promptOptions.hint) {
    write(output, `  ${promptOptions.hint}\n`);
  }
  return {
    lineCount: options.length + 1 + (promptOptions.hint ? 1 : 0),
    endedWithNewline: true,
  };
}

function renderCheckbox(question, options, selectedIndex, checkedIndexes, promptOptions, errorMessage = '') {
  const output = promptOptions.output || process.stdout;
  write(output, `${question}\n`);
  options.forEach((option, index) => {
    const cursor = index === selectedIndex ? '>' : ' ';
    const checked = checkedIndexes.has(index) ? '[x]' : '[ ]';
    write(output, `${cursor} ${checked} ${option.label}\n`);
  });
  if (promptOptions.hint) {
    write(output, `  ${promptOptions.hint}\n`);
  }
  if (errorMessage) {
    write(output, `  ! ${errorMessage}\n`);
  }
  return {
    lineCount: options.length + 1 + (promptOptions.hint ? 1 : 0) + (errorMessage ? 1 : 0),
    endedWithNewline: true,
  };
}

function renderTextInput(question, value, defaultValue, promptOptions) {
  const output = promptOptions.output || process.stdout;
  const suffix = value || (defaultValue ? `[${defaultValue}]` : '');
  write(output, `${question} ${suffix}`);
  return {
    lineCount: 1,
    endedWithNewline: false,
  };
}

function renderConfirm(question, defaultValue, promptOptions) {
  const output = promptOptions.output || process.stdout;
  write(output, `${question} ${defaultValue ? '[Y/n]' : '[y/N]'} `);
  return {
    lineCount: 1,
    endedWithNewline: false,
  };
}

function clearRenderedPrompt(output, rendered) {
  if (!rendered || !Number.isInteger(rendered.lineCount) || rendered.lineCount <= 0) {
    return;
  }

  if (rendered.endedWithNewline) {
    write(output, `\x1b[${rendered.lineCount}A\r\x1b[J`);
    return;
  }

  write(output, '\r\x1b[J');
}

function normalizeOptions(options) {
  return (Array.isArray(options) ? options : []).map((option) => {
    if (option && typeof option === 'object') {
      return {
        label: String(option.label || option.value || ''),
        value: Object.prototype.hasOwnProperty.call(option, 'value') ? option.value : option.label,
        checked: option.checked === true,
      };
    }
    return {
      label: String(option),
      value: option,
      checked: false,
    };
  }).filter((option) => option.label.length > 0);
}

function clampIndex(index, length) {
  return Number.isInteger(index) && index >= 0 && index < length ? index : 0;
}

function containsCancel(text) {
  return text.includes('\x03') || text === '\x1b';
}

function isEscapeSequenceToken(text) {
  return typeof text === 'string' && text.length > 1 && text.startsWith('\x1b');
}

function tokenizeInput(text) {
  const tokens = [];
  for (let index = 0; index < text.length; index += 1) {
    const specialToken = readSpecialKeyToken(text, index);
    if (specialToken) {
      tokens.push(specialToken.token);
      index += specialToken.length - 1;
      continue;
    }
    tokens.push(text[index]);
  }
  return tokens;
}

function readSpecialKeyToken(text, index) {
  const char = text[index];
  if (char === '\x00' || char === '\xe0') {
    const legacyDirection = text[index + 1];
    if (legacyDirection === 'H') return { token: '\x1b[A', length: 2 };
    if (legacyDirection === 'P') return { token: '\x1b[B', length: 2 };
    return null;
  }

  if (char !== '\x1b') {
    return null;
  }

  const ss3Direction = text[index + 2];
  if (text[index + 1] === 'O') {
    if (ss3Direction === 'A' || ss3Direction === 'B') {
      return { token: `\x1b[${ss3Direction}`, length: 3 };
    }
    if (ss3Direction === 'M') {
      return { token: '\r', length: 3 };
    }
    return text.length > index + 2 ? { token: text.slice(index, index + 3), length: 3 } : null;
  }

  if (text[index + 1] !== '[') {
    return text.length > index + 1 ? { token: text.slice(index, index + 2), length: 2 } : null;
  }

  for (let cursor = index + 2; cursor < text.length; cursor += 1) {
    const cursorChar = text[cursor];
    if (cursorChar === 'A' || cursorChar === 'B') {
      return { token: `\x1b[${cursorChar}`, length: cursor - index + 1 };
    }
    if (cursorChar === '~' || cursorChar === 'u') {
      const params = text.slice(index + 2, cursor).split(';');
      const token = params[0] === '13' ? '\r' : text.slice(index, cursor + 1);
      return { token, length: cursor - index + 1 };
    }
    if (/^[A-Za-z]$/.test(cursorChar)) {
      return { token: text.slice(index, cursor + 1), length: cursor - index + 1 };
    }
    if (!/^[0-9;?]$/.test(cursorChar)) {
      return null;
    }
  }

  return null;
}

function write(output, contents) {
  if (output && typeof output.write === 'function') {
    output.write(contents);
  }
}

module.exports = {
  PromptCancelled,
  checkbox,
  confirm,
  requireTty,
  select,
  textInput,
};
