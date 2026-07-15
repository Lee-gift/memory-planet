// Cloudflare Pages Function — 登录验证
export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  };

  try {
    const body = await request.json();
    const password = String(body.password || '');

    // 从 KV 读取管理员密码
    const correctPassword = await env.DANMAKU.get('admin_password');

    if (!correctPassword) {
      // 首次使用，没有设置密码，返回提示
      return new Response(JSON.stringify({ ok: false, message: '管理员未设置密码' }), { headers });
    }

    if (password !== correctPassword) {
      return new Response(JSON.stringify({ ok: false, message: '密码错误' }), { headers });
    }

    // 生成简单 token（时间戳 + 密码的哈希）
    const token = btoa(Date.now() + ':' + password);
    return new Response(JSON.stringify({ ok: true, token: token }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, message: e.message }), { headers });
  }
}
