import { renderChats } from "./chats.js"
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
  if (tab === "chats") {
    dom.pageTitle().innerText = "My Chats"
    renderChats()
    return
  }

  if (tab === "groups") {
    dom.pageTitle().innerText = "Groups"
    renderGroups()
    return
  }

  if (tab === "avatar") {
    dom.pageTitle().innerText = "Your Avatar"
    renderAvatar()
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
  }
}
