function blockParams(params, ids) {
  params.path = ids
  return params
}
function extend(obj /* , ...source */) {
  for (let i = 1; i < arguments.length; i++) {
    for (const key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key]
      }
    }
  }

  return obj
}
function appendContextPath(contextPath, id) {
  return (contextPath ? `${contextPath}.` : '') + id
}
function createFrame(object) {
  const frame = extend({}, object)
  frame._parent = object
  return frame
}
function isEmpty(value) {
  if (!value && value !== 0) {
    return true
  } if (Array.isArray(value) && value.length === 0) {
    return true
  }
  return false

}
function isPromise(value) {
  return (
    typeof value === 'object'
        && value !== null
        && typeof value.then === 'function'
  )
}

module.exports = {
  blockParams,
  extend,
  appendContextPath,
  createFrame,
  isEmpty,
  isPromise
}
