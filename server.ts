import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON body parsing middleware if needed
  app.use(express.json());

  // Proxy endpoint to bypass CORS and Tainted Canvas issues
  app.get('/api/proxy', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).send('Missing URL');
      
      const headers: Record<string, string> = {};
      if (req.headers.range) {
        headers.range = req.headers.range;
      }

      const fetchRes = await fetch(url, { headers, redirect: 'follow' });
      
      res.status(fetchRes.status);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
        const val = fetchRes.headers.get(h);
        if (val) res.setHeader(h, val);
      });

      if (!fetchRes.body) return res.end();
      
      const { Readable } = await import('stream');
      const readable = Readable.fromWeb(fetchRes.body as any);
      readable.pipe(res);
    } catch (e) {
      console.error('Proxy error', e);
      res.status(500).send('Proxy error');
    }
  });

  // API endpoints for fetching videos
  app.get('/api/videos', async (req, res) => {
    try {
      const q = req.query.query as string || 'landscape';
      const page = req.query.page as string || '1';

      let pexelsResults: any[] = [];
      let pixabayResults: any[] = [];

      try {
        const pexelsKey = process.env.PEXELS_API_KEY || 'dWsAqCjhFG3p7M2ch3nK3XasHEKjcR7d1fKvOhw6vjLxp1VRFokHQyCG';
        const pexelsRes = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=6&page=${page}`, {
          headers: { 'Authorization': pexelsKey }
        });
        const data = await pexelsRes.json();
        
        if (data.videos) {
          pexelsResults = data.videos.map((v: any) => ({
            id: String(v.id),
            source: 'pexels',
            url: v.url,
            image: v.image,
            duration: v.duration,
            width: v.width,
            height: v.height,
            video_files: v.video_files.map((f: any) => ({ link: f.link, quality: f.quality })),
            user: { name: v.user.name, url: v.user.url }
          }));
        }
      } catch (e) { 
        console.error('Pexels API Error', e); 
      }

      try {
        const pixabayKey = process.env.PIXABAY_API_KEY || '43640236-47b2ae60b618cf61eacdeec7e'; // Fallback to public demo key if available
        if (pixabayKey) {
          const pixabayRes = await fetch(`https://pixabay.com/api/videos/?key=${pixabayKey}&q=${encodeURIComponent(q)}&page=${page}&per_page=6`);
          const data = await pixabayRes.json();
          
          if (data.hits) {
            pixabayResults = data.hits.map((v: any) => ({
              id: String(v.id),
              source: 'pixabay',
              url: v.pageURL,
              image: `https://i.vimeocdn.com/video/${v.picture_id}_640x360.jpg`,
              duration: v.duration,
              width: v.videos.medium?.width || v.videos.large?.width || 0,
              height: v.videos.medium?.height || v.videos.large?.height || 0,
              video_files: [
                ...(v.videos.large?.url ? [{ link: v.videos.large.url, quality: 'hd' }] : []),
                ...(v.videos.medium?.url ? [{ link: v.videos.medium.url, quality: 'sd' }] : []),
                ...(v.videos.small?.url ? [{ link: v.videos.small.url, quality: 'sd' }] : [])
              ],
              user: { name: v.user, url: `https://pixabay.com/users/${v.user}-${v.user_id}/` }
            }));
          }
        }
      } catch (e) { 
        console.error('Pixabay API Error', e); 
      }

      // Mix the results together
      const results = [];
      const maxLen = Math.max(pexelsResults.length, pixabayResults.length);
      for (let i = 0; i < maxLen; i++) {
        if (pexelsResults[i]) results.push(pexelsResults[i]);
        if (pixabayResults[i]) results.push(pixabayResults[i]);
      }

      res.json({ results });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Use express v4 wildcard route
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
