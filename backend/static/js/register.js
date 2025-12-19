var registerData = {
    username: "",
    display_name: "",
    password: "",
    gender: "",
    age: 18,
    avatar: "panther.png"
}

var screens = document.querySelectorAll(".screen")      // collect all screens
var screenHistory = []          // keeps track of navigation history
var selectedGender = ""         // store selected gender
var isGoingBack = false         // helps us detect back navigation

var avatarOptions = document.querySelectorAll(".avatar_option")
var confirmAvatarBtn = document.getElementById("confirm_avatar")
var avatarList = document.querySelector(".avatar_list")
var avatarScrollTimeout = null


// show one screen and hide others
function show_screen(id) {
  for (var i = 0; i < screens.length; i++) {
    screens[i].style.display = "none"
  }

  document.getElementById(id).style.display = "flex"

  // add screen to history only when moving forward
  if (!isGoingBack && (screenHistory.length === 0 || screenHistory[screenHistory.length - 1] !== id)) {
    screenHistory.push(id)
  }

  isGoingBack = false

  // reset gender screen state
  if (id === "screen_gender") {
    for (var j = 0; j < genderButtons.length; j++) {
      genderButtons[j].classList.remove("selected")
    }
    nextToAgeButton.disabled = true
    selectedGender = ""
  }
}

// back navigation
function go_back() {
  if (screenHistory.length > 1) {
    isGoingBack = true
    screenHistory.pop()
    var previousScreen = screenHistory[screenHistory.length - 1]
    show_screen(previousScreen)
  } else {
    show_screen("screen_choice")
    screenHistory = ["screen_choice"]
  }
}

// forward navigation handlers

document.getElementById("go_login").onclick = function () {
  show_screen("screen_login")
}

document.getElementById("go_register").onclick = function () {
  show_screen("screen_username")
}


document.getElementById("next_to_password").onclick = function () {
    registerData.username = document.getElementById("username").value
    registerData.display_name = document.getElementById("display_name").value
  
    show_screen("screen_password")
}

document.getElementById("next_to_gender").onclick = function () {
    registerData.password = document.getElementById("password").value
    show_screen("screen_gender")
}

document.getElementById("finish_register").onclick = function () {
  show_screen("screen_avatar")
}


// gender selection logic
var genderButtons = document.querySelectorAll(".gender_btn")
var nextToAgeButton = document.getElementById("next_to_age")

for (var i = 0; i < genderButtons.length; i++) {
  genderButtons[i].onclick = function () {
    for (var j = 0; j < genderButtons.length; j++) {
      genderButtons[j].classList.remove("selected")
    }

    this.classList.add("selected")
    selectedGender = this.getAttribute("data_gender")
    registerData.gender = selectedGender
    nextToAgeButton.disabled = false
  }
}

nextToAgeButton.onclick = function () {
    show_screen("screen_age")
}

// age slider logic
var ageSlider = document.getElementById("age")
var ageValue = document.getElementById("age_value")

ageSlider.oninput = function () {
    ageValue.innerText = ageSlider.value
    registerData.age = ageSlider.value
}

// ----- Avatar carousel logic -----

function setActiveAvatar(index) {
  if (!avatarOptions[index]) return

  // clear previous selected state (we keep transforms handled separately)
  for (var i = 0; i < avatarOptions.length; i++) {
    avatarOptions[i].classList.remove("selected")
  }

  var centerEl = avatarOptions[index]
  centerEl.classList.add("selected")

  registerData.avatar = centerEl.getAttribute("data_avatar")
  confirmAvatarBtn.disabled = false
}

function updateAvatarVisuals() {
  if (!avatarList || avatarOptions.length === 0) return

  var containerRect = avatarList.getBoundingClientRect()
  var containerCenter = containerRect.left + containerRect.width / 2

  var maxScale = 1.6
  var minScale = 0.7
  var maxOpacity = 1.0
  var minOpacity = 0.3

  // distance at which the avatar is considered "far" from the center
  var maxDistance = containerRect.width / 2

  for (var i = 0; i < avatarOptions.length; i++) {
    var rect = avatarOptions[i].getBoundingClientRect()
    var elCenter = rect.left + rect.width / 2
    var distance = Math.abs(containerCenter - elCenter)

    var ratio = Math.min(distance / maxDistance, 1) // 0 (center) -> 1 (far)
    var scale = maxScale - (maxScale - minScale) * ratio
    var opacity = maxOpacity - (maxOpacity - minOpacity) * ratio

    avatarOptions[i].style.transform = "scale(" + scale + ")"
    avatarOptions[i].style.opacity = opacity
  }
}

function snapToAvatar(index, smooth) {
  if (!avatarList || !avatarOptions[index]) return

  var el = avatarOptions[index]
  var target =
    el.offsetLeft - (avatarList.clientWidth / 2 - el.offsetWidth / 2)

  avatarList.scrollTo({
    left: target,
    behavior: smooth ? "smooth" : "auto"
  })

  setActiveAvatar(index)
  updateAvatarVisuals()
}

function findClosestAvatarIndex() {
  if (!avatarList || avatarOptions.length === 0) return 0

  var containerRect = avatarList.getBoundingClientRect()
  var containerCenter = containerRect.left + containerRect.width / 2

  var closestIndex = 0
  var closestDistance = Infinity

  for (var i = 0; i < avatarOptions.length; i++) {
    var rect = avatarOptions[i].getBoundingClientRect()
    var elCenter = rect.left + rect.width / 2
    var distance = Math.abs(containerCenter - elCenter)

    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = i
    }
  }

  return closestIndex
}

// click to center & select
for (var i = 0; i < avatarOptions.length; i++) {
  (function (idx) {
    avatarOptions[idx].onclick = function () {
      snapToAvatar(idx, true)
    }
  })(i)
}

// scroll snapping behaviour
if (avatarList) {
  avatarList.addEventListener("scroll", function () {
    // continuously update scale/opacity while scrolling
    updateAvatarVisuals()

    if (avatarScrollTimeout) {
      clearTimeout(avatarScrollTimeout)
    }

    avatarScrollTimeout = setTimeout(function () {
      var index = findClosestAvatarIndex()
      snapToAvatar(index, true)
    }, 80)
  })
  
  // initialize visuals on load (in case avatar screen is visible)
  setTimeout(function () {
    updateAvatarVisuals()
  }, 0)
}


document.getElementById("confirm_avatar").onclick = function () {
  if (!registerData.avatar) {
    alert("Please select an avatar")
    return
  }

  fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(registerData)
  })
  .then(function (response) {
    return response.json()
  })
  .then(function (data) {
    if (data.success) {
      window.location.href = "/app"
    } else {
      alert(data.error || "Registration failed")
    }
  })
  .catch(function (error) {
    alert("Server error. Please try again.")
    console.error(error)
  })
}


document.getElementById("login_submit").onclick = function () {
  var username = document.getElementById("login_username").value
  var password = document.getElementById("login_password").value

  if (!username || !password) {
    alert("Please enter username and password")
    return
  }


  fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials:"include",
    body: JSON.stringify({
      username: username,
      password: password
    })
  })
  .then(function (response) {
    return response.json()
  })
  .then(function (data) {
    if (data.success) {
      window.location.href = "/app"
    } else {
      alert(data.error || "Invalid username or password")
    }
  })
  .catch(function () {
    alert("Server error. Please try again.")
  })
}


// initial screen
show_screen("screen_choice")
screenHistory = ["screen_choice"]
