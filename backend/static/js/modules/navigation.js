import { renderChats } from "./chats.js"
import { renderProfile } from "./profile.js"
import { renderFriends } from "./friends.js"
import { renderSettings } from "./settings.js"
import { renderGroups } from "./groups.js"
import { dom } from "../utils/dom.js"

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

export function showTab(tab) {
  const topBar = dom.topBar()
  
  if (tab === "chats") {
    // Show top bar only for chats
    if (topBar) {
      topBar.style.display = "flex"
    }
    dom.pageTitle().innerText = "My Chats"
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
    renderGroups()
    return
  }

  // Hide top bar for all other tabs
  if (topBar) {
    topBar.style.display = "none"
  }

  if (tab === "avatar") {
    dom.pageTitle().innerText = "Profile"
    renderProfile()
    return
  }

  if (tab === "friends") {
    dom.pageTitle().innerText = "Friends"
    renderFriends()
    return
  }

  if (tab === "settings") {
    dom.pageTitle().innerText = "Settings"
    renderSettings()
    return
  }
}
