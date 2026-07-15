const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: 'jiner-d7gnxult00d8ee047'
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('云函数被调用，event:', JSON.stringify(event));
  
  const { action } = event;
  
  try {
    // 检查action参数
    if (!action) {
      return { code: -1, message: '缺少action参数' };
    }
    
    switch (action) {
      case 'add': {
        const { text, color, timestamp } = event;
        
        // 验证参数
        if (!text || typeof text !== 'string') {
          return { code: -1, message: '弹幕内容不能为空' };
        }
        
        console.log('准备添加弹幕:', text);
        
        const result = await db.collection('danmaku').add({
          data: {
            text: text.slice(0, 50),
            color: color || '#ffffff',
            timestamp: timestamp || Date.now()
          }
        });
        
        console.log('弹幕添加成功:', result);
        return { code: 0, message: '发送成功', data: result };
      }
      
      case 'list': {
        console.log('获取弹幕列表');
        
        const result = await db.collection('danmaku')
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();
        
        console.log('获取弹幕列表成功:', result.data.length);
        return { code: 0, message: 'success', data: result.data.reverse() };
      }
      
      case 'new': {
        const { lastTime } = event;
        console.log('获取新弹幕，lastTime:', lastTime);
        
        const result = await db.collection('danmaku')
          .where({
            timestamp: db.command.gt(lastTime || 0)
          })
          .orderBy('timestamp', 'asc')
          .get();
        
        console.log('获取新弹幕成功:', result.data.length);
        return { code: 0, message: 'success', data: result.data };
      }
      
      default: {
        return { code: -1, message: '未知操作: ' + action };
      }
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return { 
      code: -1, 
      message: '服务器内部错误',
      error: error.message,
      stack: error.stack 
    };
  }
};
