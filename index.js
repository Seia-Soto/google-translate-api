const querystring = require('querystring')
const request = require('request-promise')
const google_translate_token = require('google-translate-token')

const languages = require('./languages')

const base_uri = 'https://translate.google.com/translate_a/single'

const translate = (text, options) => {
  let error
  options = options || {}

  [options.from, options.to].forEach(language => {
    if (language && !languages.isSupported(language)) {
      error = new Error()
      error.code = 400
      error.message = `The language ${language} is not supported`
    }
  })
  if (error) return new Promise((resolve, reject) => reject(error))

  options.from = options.from || 'auto'
  options.to = options.to || 'to'

  options.from = languages.getCode(options.from)
  options.to = languages.getCode(options.to)

  return google_translate_token.get(text).then(token => {
    const params = querystring.stringify({
      client: 'gtx',
      sl: options.from,
      tl: options.to,
      hl: options.to,
      dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
      ie: 'UTF-8',
      oe: 'UTF-8',
      otf: 1,
      ssel: 0,
      tsel: 0,
      kc: 7,
      q: text
    })

    return `${base_uri}?${params}`
  }).then(url => {
    return request({
      url: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36'
      }
    })
      .then(body => {
        let result = {
          text: '',
          from: {
            language: {
              didYouMean: false,
              iso: ''
            },
            text: {
              autoCorrected: false,
              value: '',
              didYouMean: false
            }
          },
          raw: ''
        }

        const data = JSON.parse(body)
        if (options.raw) result.raw = body

        data[0].forEach(objective => {
          if (objective[0]) result.text += objective[0]
        })

        if (data[2] === data[8][0][0]) {
          result.from.language.iso = data[2]
        } else {
          result.from.language.didYouMean = true
          result.from.language.iso = data[8][0][0]
        }

        if (data[7] && data[7][0]) {
          let string = data[7][0]

          string = string.replace(/<b><i>/g, '[')
          string = string.replace(/<\/i><\/b>/g, ']')

          result.from.text.value = string

          if (data[7][5] === true) {
            result.from.text.autoCorrected = true
          } else {
            result.from.text.didYouMean = true
          }
        }

        return result
      })
      .catch(error => {
        error = new Error()
        error.code = 'BAD_REQUEST'

        throw error
      })
  })
}

module.exports = translate
module.exports.languages = languages
