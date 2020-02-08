class TimeSpentProxy extends Proxy {
  constructor(target, metric) {
    const traps = {
      get: function(object, property, receiver) {
        const original = Reflect.get(object, property, receiver)

        return async function() {
          const args = Array.from(arguments)
          const end = metric.startTimer({
            provider: [target.constructor.name, property].join('/')
          })
          try {
            const result = await original.apply(target, args)
            end()
            return result
          } catch(error) {
            end()
            return false
          }
        }
      }
    }

    super(target, traps)
  }
}


export {
  TimeSpentProxy
}
