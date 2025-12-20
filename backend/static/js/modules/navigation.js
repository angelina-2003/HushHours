import { renderChats } from "./chats.js"
import { renderProfile } from "./profile.js"
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
    renderChats()
    return
  }

  // Hide top bar for all other tabs
  if (topBar) {
    topBar.style.display = "none"
  }

  if (tab === "groups") {
    dom.pageTitle().innerText = "Groups"
    dom.content().className = "app-content"
    dom.content().innerHTML = "<p style='opacity:0.6; text-align:center; padding:40px;'>Groups coming soon</p>"
    return
  }

  if (tab === "avatar") {
    dom.pageTitle().innerText = "Profile"
    renderProfile()
    return
  }

  if (tab === "friends") {
    dom.pageTitle().innerText = "Friends"
    dom.content().className = "app-content"
    dom.content().innerHTML = "<p style='opacity:0.6; text-align:center; padding:40px;'>Friends coming soon</p>"
    return
  }

  if (tab === "settings") {
    dom.pageTitle().innerText = "Settings"
    dom.content().className = "app-content"
    dom.content().innerHTML = "<p style='opacity:0.6; text-align:center; padding:40px;'>Settings coming soon</p>"
  }
}
