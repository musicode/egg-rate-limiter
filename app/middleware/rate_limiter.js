
'use strict'

const ms = require('ms')
const Limiter = require('ratelimiter')

async function thenify(fn) {
  return await new Promise((resolve, reject) => {
    fn(function (err, res) {
      if (err) {
        reject(err)
      }
      else {
        resolve(res)
      }
    })
  })
}

/**
 * options.routers = {
 *   'path': {
 *     max: max requests within duration [2500]
 *     duration: of limit in milliseconds [3600000]
 *   }
 * }
 * options.onError - 超过调用上限时的回调
 */
module.exports = (options, app) => {

  const {
    routers,
    onError,
  } = options

  return async (ctx, next) => {

    let path = ctx.url

    // GET 请求会带参数
    const index = path.indexOf('?')
    if (index >= 0) {
      path = path.substring(0, index)
    }

    const router = routers[path]

    // 未配置当前路由
    if (!router) {
      return await next()
    }

    // 获取唯一标识的 id
    // 可以是用户 id，也可以是 ip，随便
    // 请自行实现 rateLimiterId
    const id = ctx.rateLimiterId
    if (typeof id !== 'string' || !id.length) {
      return await next()
    }

    const limiter = new Limiter({
      id: `${id}:${path}`,
      db: app.redis,
      max: router.max,
      duration: router.duration,
      // limit the records count
      tidy: true,
    })

    const limit = await thenify(limiter.get.bind(limiter))

    // 即将消耗一次，因此 -1
    const remaining = limit.remaining > 0 ? limit.remaining - 1 : 0

    ctx.set({
      // 在当前时间段内剩余的请求的数量
      'X-Rate-Limit-Remaining': remaining,
      // 同一个时间段所允许的请求的最大数目
      'X-Rate-Limit-Limit': limit.total,
      // 为了得到最大请求数所等待的秒数
      'X-Rate-Limit-Reset': limit.reset
    })

    // 没有超过限制，放行
    if (limit.remaining > 0) {
      return await next()
    }

    const now = Date.now()
    const delta = (limit.reset * 1000 - now) | 0
    const after = (limit.reset - now / 1000) | 0
    ctx.set('Retry-After', after)

    if (onError) {
      onError(ctx)
    }
    else {
      // 429 表示过多的请求
      ctx.status = 429
      ctx.body = `Rate limit exceeded, retry in ${ms(delta, { long: true })}.`
    }

  }

}