export const config = {
  runtime: 'edge',
};

let danmakuList = [];

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === '/api/danmaku') {
      const action = url.searchParams.get('action');

      if (action === 'list') {
        const recent = danmakuList.slice(-10).reverse();
        return new Response(JSON.stringify({ code: 0, message: 'success', data: recent }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (action === 'new') {
        const lastTime = parseInt(url.searchParams.get('lastTime')) || 0;
        const newDanmaku = danmakuList.filter(item => item.timestamp > lastTime);
        return new Response(JSON.stringify({ code: 0, message: 'success', data: newDanmaku }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const { action: postAction, text, color, timestamp } = body;

        if (postAction === 'add') {
          if (!text || text.trim().length === 0) {
            return new Response(JSON.stringify({ code: -1, message: '弹幕内容不能为空' }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
          }

          const newItem = {
            text: text.trim().slice(0, 50),
            color: color || '#ffffff',
            timestamp: timestamp || Date.now()
          };

          danmakuList.push(newItem);
          
          if (danmakuList.length > 500) {
            danmakuList = danmakuList.slice(-500);
          }

          return new Response(JSON.stringify({ code: 0, message: '发送成功', data: newItem }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ code: -1, message: '未知操作' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ code: -1, message: '服务器错误', error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
