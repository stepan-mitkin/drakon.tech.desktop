function NavModule() {

var self = {}

var gStates = []
var gCurrent = 0

function pushState(data, title, url) {
    var state = {
        data : data,
        title : title,
        url : url
    }
    if (gCurrent < gStates.length) {
      var current = gStates[gCurrent]
      if (current.data.id !== data.id) {
        gStates.splice(gCurrent + 1)
      }
    }
    var unique = true
    if (gStates.length > 0) {
      var last = gStates[gStates.length - 1]
      unique = last.data.id !== data.id
    }
    if (unique) {      
      gStates.push(state)
    }    
    gCurrent = gStates.length - 1

    printState()
}

function printState() {
  // console.log(gCurrent)
  // console.log(gStates.map(state => state.data.id))
}

function back() {
  if (gCurrent === 0) {
    return
  }
  gCurrent--
  fireCallback()
  printState()
}

function forward() {
  if (gCurrent >= gStates.length - 1) {
    return
  }
  gCurrent++
  fireCallback()
  printState()
}

function fireCallback() {
  var state = gStates[gCurrent]
  self.onStateChange(state.data)    
}

function onDeleteFolder(id) {
  for (var i = 0; i < gStates.length; i++) {
    var state = gStates[i]
    if (state.data.id === id) {
      gStates.splice(i, 1)
      if (i <= gCurrent) {
        gCurrent--
      }
      onDeleteFolder(id)
      return
    }
  }
  printState()
}

self.pushState = pushState
self.forward = forward
self.back = back
self.onDeleteFolder = onDeleteFolder

return self
}

