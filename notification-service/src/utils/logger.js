function formatMeta(meta) {
  if (!meta || typeof meta !== 'object') {
    return '';
  }

  const entries = Object.entries(meta);
  if (entries.length === 0) {
    return '';
  }

  return ` ${JSON.stringify(meta)}`;
}

function write(level, message, meta) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}${formatMeta(meta)}`;

  if (level === 'ERROR') {
    console.error(line);
    return;
  }

  console.log(line);
}

function info(message, meta) {
  write('INFO', message, meta);
}

function error(message, meta) {
  write('ERROR', message, meta);
}

function http(message, meta) {
  write('HTTP', message, meta);
}

module.exports = {
  info,
  error,
  http
};