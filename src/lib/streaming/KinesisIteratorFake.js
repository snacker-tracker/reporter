class KinesisIteratorFake {
  constructor() {
    this._records = []
  }

  setRecords(records) {
    this._records = records.map( (record) => {
      return {
        Data: JSON.stringify(record)
      }
    })
  }

  setRecordsRaw(records) {
    this._records = records.map( (record) => {
      return {
        Data: record
      }
    })
  }


  async * records() {
    for(const record of this._records) {
      yield record
    }
  }
}

export default KinesisIteratorFake
