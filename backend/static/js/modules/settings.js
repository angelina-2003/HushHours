import { state } from "../state.js"
import { dom } from "../utils/dom.js"
import { renderProfile } from "./profile.js"
import { getMessageColor, saveMessageColor } from "./api.js"

// Color options for message colors
const MESSAGE_COLORS = [
  { name: "Blue", value: "#3b82f6", class: "color-blue" },
  { name: "Purple", value: "#8b5cf6", class: "color-purple" },
  { name: "Pink", value: "#ec4899", class: "color-pink" },
  { name: "Red", value: "#ef4444", class: "color-red" },
  { name: "Orange", value: "#f97316", class: "color-orange" },
  { name: "Yellow", value: "#eab308", class: "color-yellow" },
  { name: "Green", value: "#22c55e", class: "color-green" },
  { name: "Teal", value: "#14b8a6", class: "color-teal" },
  { name: "Cyan", value: "#06b6d4", class: "color-cyan" },
  { name: "Indigo", value: "#6366f1", class: "color-indigo" },
  { name: "Violet", value: "#a855f7", class: "color-violet" },
  { name: "Rose", value: "#f43f5e", class: "color-rose" },
  { name: "Amber", value: "#f59e0b", class: "color-amber" },
  { name: "Lime", value: "#84cc16", class: "color-lime" },
  { name: "Emerald", value: "#10b981", class: "color-emerald" },
  { name: "Sky", value: "#0ea5e9", class: "color-sky" },
  { name: "Fuchsia", value: "#d946ef", class: "color-fuchsia" },
  { name: "Gray", value: "#6b7280", class: "color-gray" },
  { name: "Coral", value: "#ff6b6b", class: "color-coral" },
  { name: "Mint", value: "#00d4aa", class: "color-mint" },
  { name: "Lavender", value: "#b794f6", class: "color-lavender" },
  { name: "Peach", value: "#ff9a56", class: "color-peach" },
  { name: "Turquoise", value: "#40e0d0", class: "color-turquoise" },
  { name: "Magenta", value: "#e91e63", class: "color-magenta" },
  { name: "Gold", value: "#ffd700", class: "color-gold" },
  { name: "Navy", value: "#1e3a8a", class: "color-navy" },
  { name: "Olive", value: "#808000", class: "color-olive" },
  { name: "Maroon", value: "#800000", class: "color-maroon" },
  { name: "Aqua", value: "#00ffff", class: "color-aqua" },
  { name: "Salmon", value: "#fa8072", class: "color-salmon" },
  { name: "Plum", value: "#dda0dd", class: "color-plum" },
  { name: "Khaki", value: "#f0e68c", class: "color-khaki" },
  { name: "Crimson", value: "#dc143c", class: "color-crimson" },
  { name: "Forest", value: "#228b22", class: "color-forest" },
  { name: "Royal", value: "#4169e1", class: "color-royal" },
  { name: "Coral Pink", value: "#ff7f7f", class: "color-coral-pink" },
  { name: "Mint Green", value: "#98fb98", class: "color-mint-green" },
  { name: "Periwinkle", value: "#ccccff", class: "color-periwinkle" }
]

export async function renderSettings() {
  // Remove create group button from settings page
  const pageHeader = document.querySelector(".page-header")
  if (pageHeader) {
    const existingBtn = pageHeader.querySelector(".create-group-header-btn")
    if (existingBtn) {
      existingBtn.remove()
    }
  }
  dom.content().className = "app-content settings-content"
  
  // Get saved message color from backend (or default grey)
  let savedColor = "#6b7280"  // Default grey
  try {
    const colorData = await getMessageColor()
    savedColor = colorData.color || "#6b7280"
    // Also sync to localStorage for quick access
    localStorage.setItem("messageColor", savedColor)
  } catch (error) {
    console.error("[DEBUG settings] Error fetching message color:", error)
    // Fallback to localStorage if backend fails
    savedColor = localStorage.getItem("messageColor") || "#6b7280"
  }
  
  dom.content().innerHTML = `
    <div class="settings-container">
      <div class="settings-section">
        <div class="settings-item" id="edit-profile-btn">
          <div class="settings-item-icon">
            <i class="fa-solid fa-user-edit"></i>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">Edit My Profile</div>
            <div class="settings-item-subtitle">Update your profile information</div>
          </div>
          <div class="settings-item-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Preferences</div>
        
        <div class="settings-item" id="message-color-btn">
          <div class="settings-item-icon">
            <i class="fa-solid fa-palette"></i>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">My Message Colour</div>
            <div class="settings-item-subtitle">Choose your message bubble color</div>
          </div>
          <div class="settings-item-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>

        <div class="settings-item" id="super-powers-btn">
          <div class="settings-item-icon">
            <i class="fa-solid fa-sparkles"></i>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">My Super Powers</div>
            <div class="settings-item-subtitle">Coming soon</div>
          </div>
          <div class="settings-item-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Privacy & Security</div>
        
        <div class="settings-item" id="privacy-security-btn">
          <div class="settings-item-icon">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">Privacy & Security</div>
            <div class="settings-item-subtitle">Manage your privacy settings</div>
          </div>
          <div class="settings-item-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-item settings-item-danger" id="logout-btn">
          <div class="settings-item-icon">
            <i class="fa-solid fa-right-from-bracket"></i>
          </div>
          <div class="settings-item-content">
            <div class="settings-item-title">Log Out</div>
            <div class="settings-item-subtitle">Sign out of your account</div>
          </div>
          <div class="settings-item-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Color Modal -->
    <div class="settings-modal" id="message-color-modal" style="display: none;">
      <div class="settings-modal-content">
        <div class="settings-modal-header">
          <h3>Choose Message Colour</h3>
          <button class="settings-modal-close" id="close-color-modal">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="color-picker-grid">
          ${MESSAGE_COLORS.map(color => `
            <div class="color-option ${color.class} ${savedColor === color.value ? 'selected' : ''}" 
                 data-color="${color.value}" 
                 data-name="${color.name}"
                 style="background-color: ${color.value}">
              <i class="fa-solid fa-check"></i>
            </div>
          `).join('')}
        </div>
        <div class="color-picker-footer">
          <button class="color-save-btn" id="save-color-btn">Save</button>
        </div>
      </div>
    </div>

    <!-- Privacy & Security Modal -->
    <div class="settings-modal" id="privacy-modal" style="display: none;">
      <div class="settings-modal-content">
        <div class="settings-modal-header">
          <h3>Privacy & Security</h3>
          <button class="settings-modal-close" id="close-privacy-modal">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="privacy-options">
          <div class="settings-item" id="delete-account-btn">
            <div class="settings-item-icon settings-item-icon-danger">
              <i class="fa-solid fa-trash"></i>
            </div>
            <div class="settings-item-content">
              <div class="settings-item-title">Delete Account</div>
              <div class="settings-item-subtitle">Permanently delete your account</div>
            </div>
            <div class="settings-item-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>
          
          <div class="settings-item" id="blocked-users-btn">
            <div class="settings-item-icon">
              <i class="fa-solid fa-ban"></i>
            </div>
            <div class="settings-item-content">
              <div class="settings-item-title">Blocked Users</div>
              <div class="settings-item-subtitle">Coming soon</div>
            </div>
            <div class="settings-item-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  
  setupSettingsListeners(savedColor)
}

function setupSettingsListeners(savedColor) {
  // If savedColor not provided, get from localStorage or use default
  if (!savedColor) {
    savedColor = localStorage.getItem("messageColor") || "#6b7280"
  }
  // Edit Profile
  const editProfileBtn = document.getElementById("edit-profile-btn")
  if (editProfileBtn) {
    editProfileBtn.onclick = async () => {
      // Switch to profile tab
      const profileTab = document.querySelector('.nav-item[data-tab="avatar"]')
      if (profileTab) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'))
        profileTab.classList.add('active')
        const { showTab } = await import("./navigation.js")
        showTab("avatar")
      }
    }
  }
  
  // Message Color
  const messageColorBtn = document.getElementById("message-color-btn")
  const messageColorModal = document.getElementById("message-color-modal")
  const closeColorModal = document.getElementById("close-color-modal")
  
  if (messageColorBtn) {
    messageColorBtn.onclick = () => {
      if (messageColorModal) messageColorModal.style.display = "flex"
    }
  }
  
  if (closeColorModal) {
    closeColorModal.onclick = () => {
      if (messageColorModal) messageColorModal.style.display = "none"
    }
  }
  
  // Store selectedColor in closure
  let selectedColor = savedColor
  window.selectedMessageColor = selectedColor
  
  // Color selection - simplified direct approach
  function setupColorSelection() {
    const colorOptions = document.querySelectorAll(".color-option")
    
    console.log("[DEBUG settings] Found", colorOptions.length, "color options")
    console.log("[DEBUG settings] Initial selected color:", selectedColor)
    
    if (colorOptions.length === 0) {
      console.warn("[DEBUG settings] No color options found")
      return false
    }
    
    colorOptions.forEach((option, index) => {
      // Get the color value
      const colorValue = option.dataset.color || option.getAttribute("data-color")
      const isCurrentlySelected = selectedColor === colorValue
      
      console.log(`[DEBUG settings] Setting up color option ${index}: ${colorValue}`)
      
      // Set up simple onclick handler
      option.onclick = function(e) {
        e.preventDefault()
        e.stopPropagation()
        
        console.log("[DEBUG settings] Color clicked:", colorValue)
        
        // Remove selected class from all
        colorOptions.forEach(opt => {
          opt.classList.remove("selected")
          const icon = opt.querySelector("i")
          if (icon) {
            icon.style.opacity = "0"
          }
        })
        
        // Add selected class to clicked
        this.classList.add("selected")
        selectedColor = colorValue
        window.selectedMessageColor = colorValue
        
        // Force show the checkmark
        const icon = this.querySelector("i")
        if (icon) {
          icon.style.opacity = "1"
          icon.style.display = "block"
          icon.style.visibility = "visible"
        }
        
        console.log("[DEBUG settings] Color selected:", selectedColor)
        console.log("[DEBUG settings] Has selected class:", this.classList.contains("selected"))
      }
      
      // Ensure checkmark is visible if this is the selected color
      if (isCurrentlySelected) {
        option.classList.add("selected")
        const icon = option.querySelector("i")
        if (icon) {
          icon.style.opacity = "1"
          icon.style.display = "block"
          icon.style.visibility = "visible"
        }
      }
    })
    
    return true
  }
  
  // Setup when modal opens
  if (messageColorModal) {
    // Setup immediately
    setTimeout(() => {
      setupColorSelection()
    }, 50)
    
    // Also setup when modal is displayed
    const observer = new MutationObserver(() => {
      if (messageColorModal.style.display === "flex") {
        setTimeout(() => {
          setupColorSelection()
        }, 100)
      }
    })
    observer.observe(messageColorModal, { attributes: true, attributeFilter: ["style"] })
    
    // Also setup on click of the message color button
    if (messageColorBtn) {
      const originalOnClick = messageColorBtn.onclick
      messageColorBtn.onclick = () => {
        if (originalOnClick) originalOnClick()
        setTimeout(() => {
          setupColorSelection()
        }, 200)
      }
    }
  }
  
  // Setup save button handler
  function setupSaveButton() {
    const saveColorBtn = document.getElementById("save-color-btn")
    if (saveColorBtn) {
      // Remove any existing handlers
      const newSaveBtn = saveColorBtn.cloneNode(true)
      saveColorBtn.parentNode.replaceChild(newSaveBtn, saveColorBtn)
      
      // Add new handler that reads from DOM
      newSaveBtn.onclick = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Get current selected color from DOM
        const selectedOption = document.querySelector(".color-option.selected")
        const currentSelectedColor = selectedOption ? (selectedOption.dataset.color || selectedOption.getAttribute("data-color")) : (window.selectedMessageColor || localStorage.getItem("messageColor") || "#6b7280")
        
        if (!currentSelectedColor) {
          console.error("[DEBUG settings] No color selected")
          alert("Please select a color first")
          return
        }
        
        console.log("[DEBUG settings] Saving color to backend:", currentSelectedColor)
        
        try {
          const result = await saveMessageColor(currentSelectedColor)
          console.log("[DEBUG settings] Save result:", result)
          
          if (result.success || result.color) {
            // Also save to localStorage for quick access
            localStorage.setItem("messageColor", currentSelectedColor)
            // Update state
            state.CURRENT_USER_MESSAGE_COLOR = currentSelectedColor
            window.selectedMessageColor = currentSelectedColor
            
            // Reload messages if a chat is open to apply new color
            // Only reload if the messages container exists (user is viewing a chat)
            if (state.ACTIVE_CONVERSATION_ID) {
              try {
                const messagesDiv = document.getElementById("messages")
                if (messagesDiv) {
                  const { loadMessages } = await import("./messages.js")
                  await loadMessages()
                }
              } catch (error) {
                console.log("[DEBUG settings] Could not reload messages (chat not open):", error)
              }
            }
            
            // Reload group messages if a group chat is open
            if (state.ACTIVE_GROUP_ID) {
              try {
                const groupMessagesDiv = document.getElementById("group-messages")
                if (groupMessagesDiv) {
                  const { loadGroupMessages } = await import("./groupMessages.js")
                  await loadGroupMessages(state.ACTIVE_GROUP_ID)
                }
              } catch (error) {
                console.log("[DEBUG settings] Could not reload group messages (group chat not open):", error)
              }
            }
            
            if (messageColorModal) messageColorModal.style.display = "none"
            
            // Show success feedback with smooth animation
            const btn = newSaveBtn
            const originalText = btn.textContent
            const originalBg = btn.style.background
            btn.textContent = "Saved! ✓"
            btn.style.background = "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            btn.style.transform = "scale(0.95)"
            
            setTimeout(() => {
              btn.textContent = originalText
              btn.style.background = originalBg || ""
              btn.style.transform = "scale(1)"
            }, 2000)
          } else {
            console.error("[DEBUG settings] Save failed:", result)
            alert("Failed to save message color. Please try again.")
          }
        } catch (error) {
          console.error("[DEBUG settings] Error saving message color:", error)
          alert("Failed to save message color. Please try again.")
        }
      }
    }
  }
  
  // Setup save button
  setupSaveButton()
  
  // Also setup when modal opens (reuse messageColorModal from line 212)
  if (messageColorModal) {
    const modalObserver = new MutationObserver(() => {
      if (messageColorModal.style.display === "flex" || messageColorModal.style.display !== "none") {
        setTimeout(() => {
          setupColorSelection()
          setupSaveButton()
        }, 50)
      }
    })
    modalObserver.observe(messageColorModal, { attributes: true, attributeFilter: ["style"] })
  }
  
  // Super Powers (placeholder)
  const superPowersBtn = document.getElementById("super-powers-btn")
  if (superPowersBtn) {
    superPowersBtn.onclick = () => {
      alert("Super Powers feature coming soon!")
    }
  }
  
  // Privacy & Security
  const privacyBtn = document.getElementById("privacy-security-btn")
  const privacyModal = document.getElementById("privacy-modal")
  const closePrivacyModal = document.getElementById("close-privacy-modal")
  
  if (privacyBtn) {
    privacyBtn.onclick = () => {
      if (privacyModal) privacyModal.style.display = "flex"
    }
  }
  
  if (closePrivacyModal) {
    closePrivacyModal.onclick = () => {
      if (privacyModal) privacyModal.style.display = "none"
    }
  }
  
  // Delete Account
  const deleteAccountBtn = document.getElementById("delete-account-btn")
  if (deleteAccountBtn) {
    deleteAccountBtn.onclick = () => {
      if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        if (confirm("This will permanently delete all your data. Are you absolutely sure?")) {
          alert("Delete account feature will be implemented soon")
          // TODO: Implement delete account API call
        }
      }
    }
  }
  
  // Blocked Users (placeholder)
  const blockedUsersBtn = document.getElementById("blocked-users-btn")
  if (blockedUsersBtn) {
    blockedUsersBtn.onclick = () => {
      alert("Blocked users feature coming soon!")
    }
  }
  
  // Logout
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      if (confirm("Are you sure you want to log out?")) {
        try {
          const response = await fetch("/logout", {
            method: "POST",
            credentials: "include"
          })
          
          if (response.ok || response.status === 200) {
            // Clear local storage
            localStorage.clear()
            // Clear session storage as well
            sessionStorage.clear()
            // Redirect to login page
            window.location.href = "/"
          } else {
            // Even if response is not ok, clear storage and redirect
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = "/"
          }
        } catch (error) {
          console.error("[DEBUG settings] Logout error:", error)
          // Even if API fails, clear local storage and redirect
          localStorage.clear()
          sessionStorage.clear()
          window.location.href = "/"
        }
      }
    }
  }
}

