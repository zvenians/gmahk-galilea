

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
if (typeof globalThis.require === 'undefined') {
  globalThis.require = require;
}

export default async function handler(req) {
  try {
    const { ImageResponse } = require('@vercel/og');
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response('ID is required', { status: 400 });
    }
    
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const baseUrl = protocol + '://' + host;
    
    const response = await fetch(baseUrl + '/api/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'getWebsiteData', args: [] })
    });
    
    if (!response.ok) {
      return new Response('Failed to fetch data', { status: 500 });
    }
    
    const json = await response.json();
    if (!json.ok || !json.data || !Array.isArray(json.data.activities)) {
      return new Response('Invalid data format', { status: 500 });
    }
    
    const activity = json.data.activities.find(a => String(a.id) === String(id));
    if (!activity) {
      return new Response('Not found', { status: 404 });
    }
    
    const rawCover = activity.coverUrl || (activity.photos && activity.photos[0]);
    if (!rawCover) {
      return new ImageResponse(
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '100%',
              height: '100%',
              backgroundColor: '#07170d',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f4e5b0',
              fontSize: 48,
              fontFamily: 'sans-serif'
            },
            children: 'GMAHK Galilea Balikpapan'
          }
        },
        {
          width: 1200,
          height: 630
        }
      );
    }
    
    let image = rawCover;
    let driveId = '';
    const matchFile = image.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (matchFile) {
      driveId = matchFile[1];
    } else {
      const matchQuery = image.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
      if (matchQuery && /drive\.(?:usercontent\.)?google\.com/i.test(image)) {
        driveId = matchQuery[1];
      }
    }
    if (driveId) {
      image = 'https://lh3.googleusercontent.com/d/' + driveId + '=w1200';
    }
    
    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: '#07170d',
            alignItems: 'center',
            justifyContent: 'center'
          },
          children: [
            {
              type: 'img',
              props: {
                src: image,
                style: {
                  objectFit: 'contain',
                  maxWidth: '1200px',
                  maxHeight: '630px'
                }
              }
            }
          ]
        }
      },
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
        }
      }
    );
  } catch (e) {
    console.error('OG Image generation error:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}
