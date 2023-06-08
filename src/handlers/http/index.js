import { glob } from 'glob'
const files = glob.sync('*.js', {
  cwd: __dirname,
})

const operations = files
  .filter(file => file != 'index.js')
  .filter(file => !file.match(/.*\.spec\.js/))
  .map(file => {
    return require('./' + file)
  })
  .reduce((accumulator, current) => {
    Object.entries(current).forEach(([name, klass]) => {
      accumulator[name] = klass
    })
    return accumulator
  }, {})

export default operations
