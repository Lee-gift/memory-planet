// Cloudflare Pages Function — 弹幕 API
// 通过 KV 存储弹幕，所有访问者共享

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const headers = {
    'Content-Type': 'application/json;charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { headers });
  }

  // 获取弹幕
  if (request.method === 'GET') {
    const action = url.searchParams.get('action');

    if (action === 'list') {
      const list = await env.DANMAKU.list();
      const items = [];
      for (const key of list.keys) {
        const item = await env.DANMAKU.get(key.name, 'json');
        if (item) items.push(item);
      }
      items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      return new Response(JSON.stringify({ code: 0, data: items }), { headers });
    }

    if (action === 'new') {
      const lastTime = parseInt(url.searchParams.get('lastTime') || '0');
      const list = await env.DANMAKU.list();
      const items = [];
      for (const key of list.keys) {
        const item = await env.DANMAKU.get(key.name, 'json');
        if (item && item.timestamp > lastTime) items.push(item);
      }
      items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      return new Response(JSON.stringify({ code: 0, data: items }), { headers });
    }

    return new Response(JSON.stringify({ code: -1, message: 'unknown action' }), { headers });
  }

  // 发送弹幕
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const text = String(body.text || '').trim().slice(0, 50);
      if (!text) {
        return new Response(JSON.stringify({ code: -1, message: '内容不能为空' }), { headers });
      }
      const danmaku = {
        text,
        color: body.color || '#ffffff',
        timestamp: Date.now()
      };
      const key = 'd_' + danmaku.timestamp + '_' + Math.random().toString(36).slice(2, 8);
      await env.DANMAKU.put(key, JSON.stringify(danmaku));
      return new Response(JSON.stringify({ code: 0, data: danmaku }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ code: -1, message: e.message }), { headers });
    }
  }

  return new Response(JSON.stringify({ code: -1, message: 'not found' }), { headers });
}
