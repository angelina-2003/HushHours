import { renderChats } from "./chats.js"
import { renderProfile } from "./profile.js"
import { renderFriends } from "./friends.js"
import { renderSettings } from "./settings.js"
import { renderGroups } from "./groups.js"
import { dom } from "../utils/dom.js"
import { state } from "../state.js"

const navItems = document.querySelectorAll(".nav-item")

export function initNavigation() {
    navItems.forEach(item => {
    item.onclick = () => {
        navItems.forEach(i => i.classList.remove("active"))
        item.classList.add("active")
        showTab(item.dataset.tab)
        }
    })
}

// Helper function to remove create group button
function removeCreateGroupButton() {
  const pageHeader = document.querySelector(".page-header")
  if (pageHeader) {
    const existingBtn = pageHeader.querySelector(".create-group-header-btn")
    if (existingBtn) {
      existingBtn.remove()
    }
  }
}

export function showTab(tab) {
  const topBar = dom.topBar()
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active')
    if (item.dataset.tab === tab) {
      item.classList.add('active')
    }
  })
  
  if (tab === "chats") {
    // Show top bar only for chats
    if (topBar) {
      topBar.style.display = "flex"
    }
    dom.pageTitle().innerText = "My Chats"
    // Clear active conversation/group when going to chats list
    state.ACTIVE_CONVERSATION_ID = null
    state.ACTIVE_GROUP_ID = null
    // Always refresh chats when switching to chats tab
    renderChats()
    return
  }

  if (tab === "groups") {
    // Show top bar is hidden for groups page (it's handled in renderGroups)
    if (topBar) {
      topBar.style.display = "none"
    }
    dom.pageTitle().innerText = "Groups"
    // Clear active group when going to groups list
    state.ACTIVE_GROUP_ID = null
    renderGroups()
    return
  }

  // Hide top bar for all other tabs
  if (topBar) {
    topBar.style.display = "none"
  }

  if (tab === "avatar") {
    dom.pageTitle().innerText = "Profile"
    // Store previous context before clearing (for back button)
    state.PROFILE_VIEW_PREVIOUS_CONVERSATION_ID = state.ACTIVE_CONVERSATION_ID
    state.PROFILE_VIEW_PREVIOUS_GROUP_ID = state.ACTIVE_GROUP_ID
    state.PROFILE_VIEW_PREVIOUS_PAGE_TITLE = dom.pageTitle()?.innerText || null
    // Clear active conversation/group when going to profile
    state.ACTIVE_CONVERSATION_ID = null
    state.ACTIVE_GROUP_ID = null
    renderProfile()
    return
  }

  if (tab === "friends") {
    dom.pageTitle().innerText = "Friends"
    // Clear active conversation when going to friends
    state.ACTIVE_CONVERSATION_ID = null
    renderFriends()
    return
  }

  if (tab === "settings") {
    dom.pageTitle().innerText = "Settings"
    renderSettings()
    return
  }
}
