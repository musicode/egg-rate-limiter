# egg-rate-limiter

限制接口调用次数

依赖 `egg-redis`

## Install

```bash
$ npm i egg-rate-limiter --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.rateLimiter = {
  enable: true,
  package: '@musicode/egg-rate-limiter',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.middleware = [
  'rateLimiter',
]
exports.rateLimiter = {
  error: '超过调用上限时的错误信息，有默认值，可不配',
  routers: {
    'a/b/c': {
      // 举个例子，1 分钟最多调 10 次
      max: 10,
      duration: 60 * 1000
    }
  }
};
```

`app/extend/context` 对象需自行扩展一个 `getter`，如下：

module.exports = {

  get rateLimiterId() {
    return '可以是用户 id、ip 或别的'
  }

}

## License

[MIT](LICENSE)
