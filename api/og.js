import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export default function handler(req,res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow','GET, HEAD');
    return res.status(405).end();
  }
  const png = readFileSync(join(process.cwd(),'public-dist/assets/social/current.png'));
  res.setHeader('Content-Type','image/png');
  res.setHeader('Content-Length',String(png.length));
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=0, must-revalidate');
  return res.status(200).end(req.method === 'HEAD' ? undefined : png);
}
