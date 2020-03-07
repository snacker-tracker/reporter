class AWSMock {
  static mock() {
    const mock = jest.fn()

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

    const once = (type, result) => {
      return function(result) {
        this.mockReturnValueOnce(type(result))
      }
    }

    const def = (type) => {
      return function(result) {
        this.mockReturnValue(type(result))
      }
    }

    Object.assign(mock, {
      'mockResolvedValue': def(resolve),
      'mockResolvedValueOnce': once(resolve),
      'mockRejectedValue': def(reject),
      'mockRejectedValueOnce': once(reject),
    })

    return mock
  }
}

class Kinesis {
  listShards = AWSMock.mock()
  getShardIterator = AWSMock.mock()
  getRecords = AWSMock.mock()
  putRecord = AWSMock.mock()
  putRecords = AWSMock.mock()
}

class S3 {
  listBucketes = AWSMock.mock()
  listObject = AWSMock.mock()
  getObject = AWSMock.mock()
  putObject = AWSMock.mock()
  deleteObject = AWSMock.mock()
}

export {
  Kinesis,
  S3
}
