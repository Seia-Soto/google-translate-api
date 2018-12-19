module.exports = class {
  constructor() {
    this.result = {
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
  }

  get() {
    return this.result
  }
}
