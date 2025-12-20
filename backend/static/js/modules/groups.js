import { state } from "../state.js"
import { dom } from "../utils/dom.js"
import { renderGroupChatView } from "./groupChat.js"

export async function renderGroups() {
  try {
    // Show top bar for groups page
    const topBar = dom.topBar()
    if (topBar) {
      topBar.style.display = "none"  // Groups page doesn't use top bar
    }
    
    // Show bottom nav
    const bottomNav = document.querySelector(".bottom-nav")
    if (bottomNav) {
      bottomNav.style.display = "flex"
    }
    
    // Remove chat-active class
    const card = document.querySelector(".card")
    if (card) {
      card.classList.remove("chat-active")
    }
    
    // Fetch groups list
    const response = await fetch("/groups", { credentials: "include" })
    
    if (!response.ok) {
      throw new Error("Failed to fetch groups")
    }
    
    const groups = await response.json()
    
    console.log("[DEBUG groups] Received groups:", groups)
    
    dom.content().className = "app-content groups-content"
    
    // Only show public groups (not joined ones) - joined groups appear in All Chats
    const publicGroups = groups.filter(g => !g.is_member)
    
    dom.content().innerHTML = `
      <div class="groups-search-container">
        <div class="groups-search-box">
          <i class="fa-solid fa-search"></i>
          <input type="text" id="groups-search-input" placeholder="Search groups..." autocomplete="off">
          <button class="search-clear-btn" id="groups-search-clear-btn" style="display: none;">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="groups-section">
        <div class="groups-section-title">Public Groups</div>
        <div class="groups-list" id="public-groups-list">
          ${publicGroups.length === 0 ? `
            <div class="groups-empty">
              <p>No public groups available</p>
            </div>
          ` : publicGroups.map(group => {
            // Extract emoji from group name or use random emoji
            const emoji = extractEmoji(group.name) || getRandomEmoji(group.group_id)
            return `
            <div class="group-item" data-group-id="${group.group_id}" data-group-name="${group.name.toLowerCase()}">
              <div class="group-avatar group-avatar-emoji">
                ${emoji}
              </div>
              <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-preview">${group.last_message_content || "No messages yet"}</div>
              </div>
              <div class="group-time">${formatTime(group.last_message_time || group.created_at)}</div>
            </div>
          `
          }).join('')}
        </div>
      </div>
    `
    
    // Setup event listeners
    setupGroupListeners()
    
  } catch (error) {
    console.error("[DEBUG groups] Error rendering groups:", error)
    dom.content().className = "app-content groups-content"
    dom.content().innerHTML = `
      <div class="groups-error">
        <p>Error loading groups</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `
  }
}

function setupGroupListeners() {
  // Search functionality
  const searchInput = document.getElementById("groups-search-input")
  const clearBtn = document.getElementById("groups-search-clear-btn")
  
  if (searchInput) {
    searchInput.oninput = (e) => {
      const query = e.target.value.trim().toLowerCase()
      
      if (query.length === 0) {
        clearBtn.style.display = "none"
        // Show all groups
        document.querySelectorAll(".group-item").forEach(item => {
          item.style.display = "flex"
        })
        return
      }
      
      clearBtn.style.display = "flex"
      
      // Filter groups by name
      document.querySelectorAll(".group-item").forEach(item => {
        const groupName = item.dataset.groupName || ""
        if (groupName.includes(query)) {
          item.style.display = "flex"
        } else {
          item.style.display = "none"
        }
      })
    }
  }
  
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (searchInput) searchInput.value = ""
      clearBtn.style.display = "none"
      document.querySelectorAll(".group-item").forEach(item => {
        item.style.display = "flex"
      })
    }
  }
  
  // Group item click handlers (for both joined and public groups)
  const groupItems = document.querySelectorAll(".group-item")
  groupItems.forEach(item => {
    item.onclick = () => {
      const groupId = parseInt(item.dataset.groupId)
      if (groupId) {
        state.ACTIVE_GROUP_ID = groupId
        state.CAME_FROM_GROUPS = true  // Track that we came from groups page
        const groupName = item.querySelector(".group-name").innerText
        dom.pageTitle().innerText = groupName
        renderGroupChatView()
      }
    }
  })
}


function formatTime(timestamp) {
  if (!timestamp) return ""
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

function extractEmoji(text) {
  // Extract first emoji from text using regex
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  const match = text.match(emojiRegex)
  return match ? match[0] : null
}

function getRandomEmoji(groupId) {
  // Use groupId as seed for consistent emoji per group
  const emojis = ['🎉', '🌟', '🔥', '💫', '⚡', '🎊', '✨', '🎈', '🎁', '🎯', '🎪', '🎭', '🎨', '🎬', '🎮', '🎲', '🎸', '🎺', '🎻', '🥁']
  return emojis[groupId % emojis.length]
}

