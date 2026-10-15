import assert from 'node:assert/strict';
import fs from 'node:fs';

function rgb(hex) {
  const value = hex.replace('#','');
  return [0,2,4].map(index => Number.parseInt(value.slice(index,index + 2),16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map(channel => channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

function ratio(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
}

const pairs = [
  ['hero schedule text','#f5f1e6','#153d2a'],
  ['hero schedule label','#d1e0d2','#153d2a'],
  ['hero schedule icon','#e6cd87','#153d2a'],
  ['news text / separate panel','#e0e9db','#071b0f'],
  ['news metadata / separate panel','#e6cd87','#071b0f'],
  ['light text / surface','#0a100c','#fafaf5'],
  ['light soft text / surface','#354239','#fafaf5'],
  ['light faint text / surface','#5f6d64','#fafaf5'],
  ['light primary button','#ffffff','#123821'],
  ['dark text / surface','#f7f7f0','#0d1811'],
  ['dark soft text / surface','#ced7ce','#0d1811'],
  ['dark faint text / surface','#a7b4a9','#0d1811'],
  ['dark primary button','#07120b','#a7c9a4'],
  ['presenter dark lyric','#ffffff','#0a2c19'],
  ['presenter dark gold','#ead597','#0a2c19'],
  ['presenter light lyric','#07140b','#cadcc9'],
  ['presenter light kicker','#4d3c0f','#cadcc9'],
  ['presenter light title','#173620','#cadcc9'],
  ['presenter light title separator','#735814','#cadcc9'],
  ['presenter light announcement copy','#294b37','#cadcc9'],
  ['presenter light controls','#12351f','#f8faf4'],
  ['presenter light active control','#ffffff','#1d5030'],
  ['WhatsApp button','#ffffff','#147c43']
];

for (const [label,foreground,background] of pairs) {
  const result = ratio(foreground,background);
  assert.ok(result >= 4.5, `${label} hanya memiliki rasio ${result.toFixed(2)}:1`);
  console.log(`OK · ${label}: ${result.toFixed(2)}:1`);
}

const visitorCss = fs.readFileSync(new URL('../visitor-ui.css', import.meta.url),'utf8');
const tokens = block => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(match => [match[1],match[2]]));
const light = tokens(visitorCss.match(/:root\s*\{([^}]+)\}/)[1]);
const dark = tokens(visitorCss.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/)[1]);
const cinema = tokens(visitorCss.match(/:is\(\.film-hero,[\s\S]*?\)\s*\{([^}]+)\}/)[1]);
for (const [name,theme] of [['terang',light],['gelap',dark],['kartu hijau',cinema]]) {
  for (const [foreground,background] of [['control-text','control-bg'],['control-text','control-hover'],['control-on-primary','control-primary']]) {
    const result = ratio(theme[foreground],theme[background]);
    assert.ok(result >= 4.5, `${name}: ${foreground} / ${background} ${result.toFixed(2)}:1`);
    console.log(`OK · tombol ${name}: ${result.toFixed(2)}:1`);
  }
  for (const foreground of ['control-border','control-focus']) {
    assert.ok(ratio(theme[foreground],theme['control-bg']) >= 3, `${name}: batas dan fokus harus terlihat.`);
  }
}
