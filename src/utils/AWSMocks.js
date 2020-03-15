const response = (type, result) => {
  return {
    promise: function() {
      return Promise[type](result)
    }
  }
}

const resolve = (result) => {
  return response('resolve', result)
}

const reject = (result) => {
  return response('reject', result)
}

const once = (type) => {
  return function(result) {
    this.mockReturnValueOnce(type(result))
  }
}

const def = (type) => {
  return function(result) {
    this.mockReturnValue(type(result))
  }
}

const build = () => {
  const mock = jest.fn()

  Object.assign(mock, {
    'mockResolvedValue': def(resolve),
    'mockResolvedValueOnce': once(resolve),
    'mockRejectedValue': def(reject),
    'mockRejectedValueOnce': once(reject),
  })

  return mock
}


class Kinesis {
  listShards = build()
  getShardIterator = build()
  getRecords = build()
  putRecord = build()
  putRecords = build()
}

class S3 {
  listBuckets = build()
  listObject = build()
  getObject = build()
  putObject = build()
  deleteObject = build()
}

export {
  Kinesis,
  S3
}
