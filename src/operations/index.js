import glob from 'glob'
const files = glob.sync('*.js', {
  cwd: __dirname,
})

const operations = files
  .filter(f => f != 'index.js')
  .map(f => {
    return require('./' + f)
  })
  .reduce((accumulator, current) => {
    Object.entries(current).forEach(([name, klass]) => {
      accumulator[name] = klass
    })
    return accumulator
  }, {})

export default operations
