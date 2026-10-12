import assert from 'node:assert/strict';

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function ratio(foreground, background) {
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const pairs = [
  ['light text / surface', '#0a100c', '#fafaf5'],
  ['light soft text / surface', '#354239', '#fafaf5'],
  ['light faint text / surface', '#5f6d64', '#fafaf5'],
  ['light primary button', '#ffffff', '#123821'],
  ['dark text / surface', '#f7f7f0', '#0d1811'],
  ['dark soft text / surface', '#ced7ce', '#0d1811'],
  ['dark faint text / surface', '#a7b4a9', '#0d1811'],
  ['dark primary button', '#07120b', '#a7c9a4'],
  ['presenter dark lyric', '#ffffff', '#0a2c19'],
  ['presenter dark gold', '#ead597', '#0a2c19'],
  ['presenter light lyric', '#07140b', '#cadcc9'],
  ['presenter light kicker', '#4d3c0f', '#cadcc9'],
  ['presenter light title', '#173620', '#cadcc9'],
  ['presenter light title separator', '#735814', '#cadcc9'],
  ['presenter light announcement copy', '#294b37', '#cadcc9'],
  ['presenter light controls', '#12351f', '#f8faf4'],
  ['presenter light active control', '#ffffff', '#1d5030'],
  ['WhatsApp button', '#ffffff', '#147c43'],
];

for (const [label, foreground, background] of pairs) {
  const result = ratio(foreground, background);
  assert.ok(result >= 4.5, `${label} hanya memiliki rasio ${result.toFixed(2)}:1`);
  console.log(`OK · ${label}: ${result.toFixed(2)}:1`);
}
