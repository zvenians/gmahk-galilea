import part00 from '../og-data/part-00.js';
import part01 from '../og-data/part-01.js';
import part02 from '../og-data/part-02.js';
import part03 from '../og-data/part-03.js';
import part04 from '../og-data/part-04.js';
import part05 from '../og-data/part-05.js';
import part06 from '../og-data/part-06.js';
import part07 from '../og-data/part-07.js';
import part08 from '../og-data/part-08.js';
import part09 from '../og-data/part-09.js';

const OG_IMAGE = Buffer.from(
  [part00, part01, part02, part03, part04, part05, part06, part07, part08, part09].join(''),
  'base64',
);

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', String(OG_IMAGE.length));
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');

  if (req.method === 'HEAD') return res.status(200).end();
  return res.status(200).end(OG_IMAGE);
}
