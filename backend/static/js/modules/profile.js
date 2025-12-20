import { state } from "../state.js"
import { fetchMe } from "./api.js"
import { dom } from "../utils/dom.js"
import { initAvatarCarousel } from "./avatarCarousel.js"

export async function renderProfile() {
  try {
    // Fetch current user data
    const userData = await fetchMe()
    
    if (!userData) {
      console.error("[DEBUG profile] No user data received")
      dom.content().className = "app-content profile-content"
      dom.content().innerHTML = "<p style='text-align:center; opacity:0.6; padding:40px;'>Error loading profile</p>"
      return
    }
    
    console.log("[DEBUG profile] User data received:", userData)

  // Generate personal link
  const personalLink = `${window.location.origin}/profile/${userData.username}`
  
  // Available gift types
  const giftTypes = ["🎁", "💝", "🌹", "⭐"]
  
  // Get gift counts from user data (default to 0 if not present)
  const giftCounts = userData.gifts || {}
  
  // Debug: Log gift counts
  console.log("[DEBUG profile] Gift counts:", giftCounts)
  console.log("[DEBUG profile] User data gifts:", userData.gifts)
  
  // Format gender display
  const genderDisplay = userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : "Not set"
  
  dom.content().className = "app-content profile-content"
  dom.content().innerHTML = `
    <div class="profile-container">
      <!-- Avatar -->
      <div class="profile-avatar-wrapper">
        <img class="profile-avatar" id="profile-avatar-img" src="/static/avatars/${userData.avatar || 'default.png'}" alt="Avatar" onerror="this.src='/static/avatars/default.png'">
        <!-- Avatar Menu Bubble -->
        <div class="avatar-menu-bubble" id="avatar-menu" style="display: none;">
          <button class="avatar-menu-item" id="change-avatar-btn">
            <i class="fa-solid fa-image"></i>
            <span>Change Avatar</span>
          </button>
          <button class="avatar-menu-item" id="select-accessories-btn">
            <i class="fa-solid fa-gem"></i>
            <span>Select Accessories</span>
          </button>
        </div>
      </div>
      
      <!-- Display Name -->
      <h2 class="profile-display-name">${userData.display_name || userData.username}</h2>
      
      <!-- Username -->
      <p class="profile-username">@${userData.username}</p>
      
      <!-- Info Bar -->
      <div class="profile-info-bar">
        <div class="info-item">
          <span class="info-label">Gender</span>
          <span class="info-value">${genderDisplay}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">Age</span>
          <span class="info-value">${userData.age || "N/A"}</span>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <span class="info-label">Hush Points</span>
          <span class="info-value">${userData.hush_points || 0}</span>
        </div>
      </div>
      
      <!-- Gifts Section -->
      <div class="profile-gifts-section">
        <h3 class="gifts-title">Gifts Received</h3>
        <div class="gifts-grid">
          ${giftTypes.map(giftType => {
            const count = giftCounts[giftType] || 0
            return `
              <div class="gift-item">
                <span class="gift-emoji">${giftType}</span>
                <span class="gift-count">${count}</span>
              </div>
            `
          }).join('')}
        </div>
      </div>
      
      <!-- Personal Link Section -->
      <div class="profile-link-section">
        <h3 class="link-title">Your Personal Link</h3>
        <div class="link-container-centered">
          <input type="text" class="link-input-centered" id="personal-link-input" value="${personalLink}" readonly>
          <button class="link-copy-btn-centered" id="copy-link-btn">
            <i class="fa-solid fa-copy"></i>
          </button>
        </div>
        <p class="link-hint">Share this link to let others find your profile</p>
      </div>
      
      <!-- Avatar Carousel Modal (hidden by default) -->
      <div class="avatar-modal" id="avatar-modal" style="display: none;">
        <div class="avatar-modal-content">
          <div class="avatar-modal-header">
            <h2>Choose your avatar</h2>
            <button class="avatar-modal-close" id="close-avatar-modal">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="avatar_list" id="profile-avatar-list">
            <!-- Avatars will be loaded here -->
          </div>
          <button class="confirm-avatar-btn" id="confirm_avatar" disabled>Confirm</button>
        </div>
      </div>
    </div>
  `
  
  // Setup copy link functionality
  const copyBtn = document.getElementById("copy-link-btn")
  const linkInput = document.getElementById("personal-link-input")
  
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(personalLink)
      
      // Update button to show success
      const copyText = copyBtn.querySelector(".copy-text")
      const originalText = copyText.textContent
      copyText.textContent = "Copied!"
      copyBtn.classList.add("copied")
      
      // Reset after 2 seconds
      setTimeout(() => {
        copyText.textContent = originalText
        copyBtn.classList.remove("copied")
      }, 2000)
    } catch (err) {
      // Fallback for older browsers
      linkInput.select()
      document.execCommand("copy")
      
      const copyText = copyBtn.querySelector(".copy-text")
      const originalText = copyText.textContent
      copyText.textContent = "Copied!"
      copyBtn.classList.add("copied")
      
      setTimeout(() => {
        copyText.textContent = originalText
        copyBtn.classList.remove("copied")
      }, 2000)
    }
  }
  
  // Also allow clicking on input to select
  linkInput.onclick = () => {
    linkInput.select()
  }
  
  // Avatar menu functionality
  const avatarImg = document.getElementById("profile-avatar-img")
  const avatarMenu = document.getElementById("avatar-menu")
  const changeAvatarBtn = document.getElementById("change-avatar-btn")
  const selectAccessoriesBtn = document.getElementById("select-accessories-btn")
  const avatarModal = document.getElementById("avatar-modal")
  const closeAvatarModal = document.getElementById("close-avatar-modal")
  const confirmAvatarBtn = document.getElementById("confirm_avatar")
  
  // List of available avatars (from register.html)
  const availableAvatars = [
    "brownbear.png", "cat.png", "cow.png", "gorilla.png",
    "lion.png", "panda.png", "panther.png", "smalldog.png"
  ]
  
  // Toggle avatar menu on avatar click
  avatarImg.onclick = (e) => {
    e.stopPropagation()
    const isVisible = avatarMenu.style.display !== "none"
    avatarMenu.style.display = isVisible ? "none" : "block"
  }
  
  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!avatarMenu.contains(e.target) && e.target !== avatarImg) {
      avatarMenu.style.display = "none"
    }
  })
  
  // Change avatar button
  changeAvatarBtn.onclick = () => {
    avatarMenu.style.display = "none"
    showAvatarCarousel()
  }
  
  // Select accessories button (placeholder)
  selectAccessoriesBtn.onclick = () => {
    avatarMenu.style.display = "none"
    alert("Accessories feature coming soon!")
  }
  
  // Show avatar carousel modal
  function showAvatarCarousel() {
    const avatarList = document.getElementById("profile-avatar-list")
    
    // Populate avatar list
    avatarList.innerHTML = availableAvatars.map(avatar => `
      <button class="avatar_option" data_avatar="${avatar}">
        <img src="/static/avatars/${avatar}" alt="${avatar}">
      </button>
    `).join('')
    
    // Add padding for edge avatars
    avatarList.style.paddingLeft = "50%"
    avatarList.style.paddingRight = "50%"
    
    avatarModal.style.display = "flex"
    
    // Initialize carousel
    const carousel = initAvatarCarousel("avatar-modal", async (selectedAvatar) => {
      // Update avatar via API
      try {
        const response = await fetch("/update-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ avatar: selectedAvatar })
        })
        
        if (response.ok) {
          // Update displayed avatar
          avatarImg.src = `/static/avatars/${selectedAvatar}`
          state.CURRENT_USER_AVATAR = selectedAvatar
          
          // Update bottom nav avatar
          const navAvatar = dom.avatarImg()
          if (navAvatar) {
            navAvatar.src = `/static/avatars/${selectedAvatar}`
          }
          
          // Close modal
          avatarModal.style.display = "none"
        } else {
          alert("Failed to update avatar. Please try again.")
        }
      } catch (error) {
        console.error("Error updating avatar:", error)
        alert("Failed to update avatar. Please try again.")
      }
    })
    
    // Set current avatar as selected
    if (carousel && userData.avatar) {
      carousel.setSelectedAvatar(userData.avatar)
    }
  }
  
  // Close avatar modal
  closeAvatarModal.onclick = () => {
    avatarModal.style.display = "none"
  }
  
  // Close modal when clicking outside
  avatarModal.onclick = (e) => {
    if (e.target === avatarModal) {
      avatarModal.style.display = "none"
    }
  }
  
  } catch (error) {
    console.error("[DEBUG profile] Error rendering profile:", error)
    dom.content().className = "app-content profile-content"
    dom.content().innerHTML = `
      <p style='text-align:center; opacity:0.6; padding:40px;'>
        Error loading profile. Please refresh the page.
      </p>
    `
  }
}

