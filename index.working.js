const querystring = require('querystring')
const got = require('got')
const token = require('google-translate-token')

const { Issue, Result } = require('./constructors')
const languages = require('./languages')

const base = {
  uri: 'https://translate.google.com/translate_a/single',
  options: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36'
  }
}

const translate = (text, opts) => {
  opts = opts || {}

  let error = new Issue()
  let selectedLanguages = [opts.from, opts.to]
  selectedLanguages.forEach(language => {
    if (language && !languages.isSupported(language)) {
      error.create({
        code: 400,
        message: `The language '${language}' isn't supported`
      })
    }
  })
  if (error) return new Promise((resolve, reject) => reject(error.errorTemplate))

  opts.from = opts.from || 'auto'
  opts.to = opts.to || 'en'

  opts.from = languages.getCode(opts.from)
  opts.to = languages.getCode(opts.to)

  return token.get(text).then(token => {
    let data = {
      client: 'gtx',
      sl: opts.from,
      tl: opts.to,
      hl: opts.to,
      dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
      ie: 'UTF-8',
      oe: 'UTF-8',
      otf: 1,
      ssel: 0,
      tsel: 0,
      kc: 7,
      q: text
    }
    data[token.name] = token.value

    return `${base.url}?${querystring.stringify(data)}`
  }).then(url => {
    return got(url, base.options)
  }).then(res => {
    let result = new Result().get()
    let body = JSON.parse(res.body)

    if (opts.raw) result.raw = res.body
    body[0].forEach(objective => {
      if (objective[0]) result.text += objective[0]
    })

    if (body[2] === body[8][0][0]) {
      result.from.language.iso = body[2]
    } else {
      result.from.language.didYouMean = true
      result.from.language.iso = body[8][0][0]
    }

    if (body[7] && body[7][0]) {
      result.from.text.value = body[7][0].replace(/<b><i>/g, '[').replace(/<\/i><\/b>/g, ']')

      if (body[7][5] === true) {
        result.from.text.autoCorrected = true
      } else {
        result.from.text.didYouMean = true
      }
    }

    return result
  }).catch(rejection => {
    let error = new Issue()
    if (rejection.statusCode !== undefined && rejection.statusCode !== 200) {
      error.create({
        code: 'BAD_REQUEST'
      })
    } else {
      error.create({
        code: 'BAD_NETWORK'
      })
    }

    throw error
  })
}

module.exports = translate
module.exports.languages = languages
