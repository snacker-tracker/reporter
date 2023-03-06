
const operation_to_handler = (operationId, operation, dependencies) => {
  return [async (req, res) => {
    const deps = dependencies(operation, req)
    const cmd = new operation(deps)

    let response
    try {
      response = await cmd.run(req, res)
    } catch (error) {
      deps.logger.warn(error.toString())
      response = {
        status: error.status || 500,
        body: error,
        headers: {}
      }
    }

    return res
      .status(response.status)
      .set(response.headers)
      .set(
        'Access-Control-Expose-Headers',
        'X-Swagger-Response-Valid, X-Swagger-Response-Error-Count')
      .json(response.body)
  }, operationId]
}

export default operation_to_handler
