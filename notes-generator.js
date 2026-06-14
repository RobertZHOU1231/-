/**
 * 口译笔记生成模块
 * 调用通义千问 API，将英文演讲内容转化为结构化口译笔记。
 *
 * 导出:
 *   generateNotes(englishText, callbacks?) -> Promise<string>
 *   debouncedGenerateNotes           -> 防抖版 generateNotes（800ms）
 */

// ── API 配置 ──────────────────────────────────────────────
const API_CONFIG = {
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  apiKey: 'sk-cec6ea52e26548b2a44b9daf8443674f ',
  model: 'qwen-turbo',
};

// ── 系统提示词 ────────────────────────────────────────────
const SYSTEM_PROMPT =
  '你是一位专业的口译员，请将以下英文演讲内容转化为简明口译笔记。要求：\n' +
  '1. 使用缩进（每级两个空格）表示层次结构。\n' +
  '2. 使用常用符号（→ 表示导致，↑ 表示上升，↓ 表示下降，+ 表示加上，- 表示减少，∵ 因为，∴ 所以）。\n' +
  '3. 使用英文缩写（gov=政府，intl=国际，max=最大，min=最小，ref=参考）。\n' +
  '4. 中英文混合使用，以简洁为原则。\n' +
  '5. 不要输出任何额外解释，直接输出笔记内容。\n' +
  '英文内容：{englishText}';

// ── 公共配置方法 ──────────────────────────────────────────

/** 设置通义千问 API Key */
export function setApiKey(apiKey) {
  API_CONFIG.apiKey = apiKey;
}

/** 设置 API 基础 URL（可选，用于代理或私有部署） */
export function setBaseURL(baseURL) {
  API_CONFIG.baseURL = baseURL;
}

/** 设置模型名称（默认 qwen-turbo） */
export function setModel(model) {
  API_CONFIG.model = model;
}

// ── 核心方法 ──────────────────────────────────────────────

/**
 * 调用通义千问 API 生成口译笔记
 *
 * @param {string} englishText  - 待转换的英文演讲文本
 * @param {object} [callbacks]  - 可选回调
 * @param {function} [callbacks.onLoading] - 加载中回调，参数: '正在生成笔记…'
 * @param {function} [callbacks.onSuccess] - 成功回调，参数: 生成的笔记字符串
 * @param {function} [callbacks.onError]   - 失败回调，参数: 错误信息字符串
 * @returns {Promise<string>} 生成的口译笔记
 */
export async function generateNotes(englishText, callbacks = {}) {
  const { onLoading, onSuccess, onError } = callbacks;

  // 参数校验
  if (!englishText || typeof englishText !== 'string') {
    const error = new Error('请输入有效的英文文本');
    if (onError) onError(error.message);
    throw error;
  }

  if (!API_CONFIG.apiKey) {
    const error = new Error('请先调用 setApiKey() 设置通义千问 API Key');
    if (onError) onError(error.message);
    throw error;
  }

  const userMessage = SYSTEM_PROMPT.replace('{englishText}', englishText);

  try {
    if (onLoading) onLoading('正在生成笔记…');

    const response = await fetch(API_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: [
          { role: 'system', content: '你是一位专业的口译员。' },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      let detail = '';
      try {
        const errBody = await response.json();
        detail = errBody.message || errBody.code || JSON.stringify(errBody);
      } catch (_) {
        detail = await response.text();
      }
      throw new Error(`API 请求失败 (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const notes = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    if (onSuccess) onSuccess(notes);
    return notes;
  } catch (error) {
    const message = error.message || '生成笔记失败，请稍后重试';
    if (onError) onError(message);
    throw error;
  }
}

// ── 防抖工具 ──────────────────────────────────────────────

/**
 * 创建一个防抖版本的异步函数
 * 在 delay 毫秒内多次调用只会执行最后一次
 *
 * @param {function} fn   - 原始异步函数
 * @param {number} delay  - 防抖延迟（毫秒）
 * @returns {function} 防抖后的函数
 */
function debounce(fn, delay) {
  let timer = null;

  return function (...args) {
    return new Promise((resolve, reject) => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(async () => {
        timer = null;
        try {
          const result = await fn.apply(this, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * 防抖版口译笔记生成函数（800ms 防抖）
 * 适用于用户实时输入场景，避免频繁调用 API
 */
export const debouncedGenerateNotes = debounce(generateNotes, 800);
