import { state } from "../state.js"
import { dom } from "../utils/dom.js"
import { renderProfile } from "./profile.js"

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
  { name: "Slate", value: "#64748b", class: "color-slate" },
  { name: "Gray", value: "#6b7280", class: "color-gray" },
  { name: "Zinc", value: "#71717a", class: "color-zinc" }
]

export async function renderSettings() {
  dom.content().className = "app-content settings-content"
  
  // Get saved message color from localStorage (or default)
  const savedColor = localStorage.getItem("messageColor") || "#3b82f6"
  
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
  
  setupSettingsListeners()
}

function setupSettingsListeners() {
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
  
  // Color selection
  const colorOptions = document.querySelectorAll(".color-option")
  let selectedColor = localStorage.getItem("messageColor") || "#3b82f6"
  
  colorOptions.forEach(option => {
    option.onclick = () => {
      // Remove selected class from all
      colorOptions.forEach(opt => opt.classList.remove("selected"))
      // Add selected class to clicked
      option.classList.add("selected")
      selectedColor = option.dataset.color
    }
  })
  
  // Save color
  const saveColorBtn = document.getElementById("save-color-btn")
  if (saveColorBtn) {
    saveColorBtn.onclick = () => {
      localStorage.setItem("messageColor", selectedColor)
      if (messageColorModal) messageColorModal.style.display = "none"
      alert("Message color saved! (Backend implementation coming soon)")
    }
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
          
          if (response.ok) {
            // Clear local storage
            localStorage.clear()
            // Redirect to login page
            window.location.href = "/"
          } else {
            alert("Failed to log out. Please try again.")
          }
        } catch (error) {
          console.error("[DEBUG settings] Logout error:", error)
          // Even if API fails, clear local storage and redirect
          localStorage.clear()
          window.location.href = "/"
        }
      }
    }
  }
}

