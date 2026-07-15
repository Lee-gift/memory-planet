const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 弹幕数据文件路径
const DANMAKU_FILE = path.join(__dirname, 'danmaku.json');

// 初始化弹幕文件
function initDanmakuFile() {
  if (!fs.existsSync(DANMAKU_FILE)) {
    fs.writeFileSync(DANMAKU_FILE, JSON.stringify([]));
  }
}

// 获取弹幕列表
app.get('/api/danmaku/list', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DANMAKU_FILE, 'utf8'));
    // 返回最近10条
    const recent = data.slice(-10).reverse();
    res.json({ code: 0, message: 'success', data: recent });
  } catch (error) {
    res.json({ code: -1, message: '读取失败', error: error.message });
  }
});

// 获取新弹幕
app.get('/api/danmaku/new', (req, res) => {
  try {
    const lastTime = parseInt(req.query.lastTime) || 0;
    const data = JSON.parse(fs.readFileSync(DANMAKU_FILE, 'utf8'));
    const newDanmaku = data.filter(item => item.timestamp > lastTime);
    res.json({ code: 0, message: 'success', data: newDanmaku });
  } catch (error) {
    res.json({ code: -1, message: '读取失败', error: error.message });
  }
});

// 添加弹幕
app.post('/api/danmaku/add', (req, res) => {
  try {
    const { text, color, timestamp } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.json({ code: -1, message: '弹幕内容不能为空' });
    }

    const data = JSON.parse(fs.readFileSync(DANMAKU_FILE, 'utf8'));
    const newItem = {
      text: text.trim().slice(0, 50),
      color: color || '#ffffff',
      timestamp: timestamp || Date.now()
    };
    
    data.push(newItem);
    
    // 最多保存500条
    if (data.length > 500) {
      data.splice(0, data.length - 500);
    }
    
    fs.writeFileSync(DANMAKU_FILE, JSON.stringify(data));
    res.json({ code: 0, message: '发送成功', data: newItem });
  } catch (error) {
    res.json({ code: -1, message: '保存失败', error: error.message });
  }
});

// 初始化
initDanmakuFile();

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
