class ImageRepository {
  constructor(s3client, bucket) {
    this.client = s3client
    this.bucket = bucket
  }

  async put(key, readable) {
    const args = {
      Bucket: this.bucket,
      Key: key,
      Body: readable
    }

    return this.client.upload(args).promise()
  }

  async list(prefix) {
    const params = {
      Bucket: this.bucket,
      Prefix: prefix
    }

    return this.client.listObjects(params).promise()
  }

  presign(key) {
    const args = {
      Bucket: this.bucket,
      Key: key,
      Expires: 300
    }

    return this.client.getSignedUrl('getObject', {
      ...args
    })
  }
}

export default ImageRepository
