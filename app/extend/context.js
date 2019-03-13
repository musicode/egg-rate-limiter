
'use strict'

module.exports = {

  // 默认用 ip
  get rateLimiterId() {
    return this.ip
  }

}