// Shared avatar carousel component
// Can be used in registration and profile

export function initAvatarCarousel(containerId, onSelect) {
  const container = document.getElementById(containerId)
  if (!container) return null

  const avatarList = container.querySelector(".avatar_list")
  const avatarOptions = container.querySelectorAll(".avatar_option")
  const confirmBtn = container.querySelector("#confirm_avatar")
  
  let avatarScrollTimeout = null
  let selectedAvatar = null

  function setActiveAvatar(index) {
    if (!avatarOptions[index]) return

    for (let i = 0; i < avatarOptions.length; i++) {
      avatarOptions[i].classList.remove("selected")
    }

    const centerEl = avatarOptions[index]
    centerEl.classList.add("selected")
    selectedAvatar = centerEl.getAttribute("data_avatar")
    
    if (confirmBtn) {
      confirmBtn.disabled = false
    }
  }

  function updateAvatarVisuals() {
    if (!avatarList || avatarOptions.length === 0) return

    const containerRect = avatarList.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    const maxScale = 1.6
    const minScale = 0.7
    const maxOpacity = 1.0
    const minOpacity = 0.3
    const maxDistance = containerRect.width / 2

    for (let i = 0; i < avatarOptions.length; i++) {
      const rect = avatarOptions[i].getBoundingClientRect()
      const elCenter = rect.left + rect.width / 2
      const distance = Math.abs(containerCenter - elCenter)
      const ratio = Math.min(distance / maxDistance, 1)
      const scale = maxScale - (maxScale - minScale) * ratio
      const opacity = maxOpacity - (maxOpacity - minOpacity) * ratio

      avatarOptions[i].style.transform = `scale(${scale})`
      avatarOptions[i].style.opacity = opacity
    }
  }

  function snapToAvatar(index, smooth) {
    if (!avatarList || !avatarOptions[index]) return

    const el = avatarOptions[index]
    const target = el.offsetLeft - (avatarList.clientWidth / 2 - el.offsetWidth / 2)

    avatarList.scrollTo({
      left: target,
      behavior: smooth ? "smooth" : "auto"
    })

    setActiveAvatar(index)
    updateAvatarVisuals()
  }

  function findClosestAvatarIndex() {
    if (!avatarList || avatarOptions.length === 0) return 0

    const containerRect = avatarList.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    let closestIndex = 0
    let closestDistance = Infinity

    for (let i = 0; i < avatarOptions.length; i++) {
      const rect = avatarOptions[i].getBoundingClientRect()
      const elCenter = rect.left + rect.width / 2
      const distance = Math.abs(containerCenter - elCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }

    return closestIndex
  }

  // Click to center & select
  avatarOptions.forEach((option, idx) => {
    option.onclick = () => {
      snapToAvatar(idx, true)
    }
  })

  // Scroll snapping
  if (avatarList) {
    avatarList.addEventListener("scroll", () => {
      updateAvatarVisuals()

      if (avatarScrollTimeout) {
        clearTimeout(avatarScrollTimeout)
      }

      avatarScrollTimeout = setTimeout(() => {
        const index = findClosestAvatarIndex()
        snapToAvatar(index, true)
      }, 80)
    })

    setTimeout(() => {
      updateAvatarVisuals()
    }, 0)
  }

  // Confirm button
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (selectedAvatar && onSelect) {
        onSelect(selectedAvatar)
      }
    }
  }

  return {
    getSelectedAvatar: () => selectedAvatar,
    setSelectedAvatar: (avatar) => {
      // Find index of avatar and snap to it
      for (let i = 0; i < avatarOptions.length; i++) {
        if (avatarOptions[i].getAttribute("data_avatar") === avatar) {
          snapToAvatar(i, false)
          break
        }
      }
    }
  }
}

