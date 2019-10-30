const objectMetadataToJson = (json) => {
  json.meta = {}
  if(json._created_at || json._created_by) {
    json.meta.created = {}

    if(json._created_at) {
      json.meta.created.at = json._created_at
    }

    if(json._created_by) {
      json.meta.created.by = json._created_by
    }
  }

  if(json._updated_at || json._updated_by) {
    json.meta.updated = {}

    if(json._updated_at) {
      json.meta.updated.at = json._updated_at
    }

    if(json._updated_by) {
      json.meta.updated.by = json._updated_by
    }
  }

  if(json._deleted_at || json._deleted_by) {
    json.meta.deleted = {}

    if(json._deleted_at) {
      json.meta.deleted.at = json._deleted_at
    }

    if(json._deleted_by) {
      json.meta.deleted.by = json._deleted_by
    }
  }

  delete json._created_at
  delete json._created_by
  delete json._updated_at
  delete json._updated_by
  delete json._deleted_at
  delete json._deleted_by

  return json
}

const objectMetadataFromJson = (json) => {
  if(json.meta) {
    if(json.meta.created) {
      if(json.meta.created.at) {
        json._created_at = json.meta.created.at
      }

      if(json.meta.created.by) {
        json._created_by = json.meta.created.by
      }
    }

    if(json.meta.updated) {
      if(json.meta.updated.at) {
        json._updated_at = json.meta.updated.at
      }

      if(json.meta.updated.by) {
        json._updated_by = json.meta.updated.by
      }
    }

    if(json.meta.updated) {
      if(json.meta.updated.at) {
        json._updated_at = json.meta.updated.at
      }

      if(json.meta.updated.by) {
        json._updated_by = json.meta.updated.by
      }
    }
  }

  return json
}

export {
  objectMetadataToJson,
  objectMetadataFromJson
}
