module.exports = class {
  constructor() {
    this.errorTemplate
  }

  create(as) {
    this.errorTemplate = new Error()

    this.errorTemplate.code = as.code
    this.errorTemplate.message = as.message
  }
  get() {
    return this.errorTemplate
  }
}
