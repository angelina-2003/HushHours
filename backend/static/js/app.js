
console.log("APP.JS DEFINITELY LOADED");

import {state} from "./state.js"
import {fetchMe} from "./modules/api.js"
import { initNavigation, showTab } from "./modules/navigation.js"
import { dom } from "./utils/dom.js"

console.log("APP.JS LOADED")

async function initUser(){
  try {
    const data = await fetchMe()
    if (!data || !data.id) {
      console.error("[DEBUG] Failed to fetch user data")
      return
    }
    
    state.CURRENT_USER_ID = data.id
    state.CURRENT_USER_AVATAR = data.avatar

    // Set avatar image after a short delay to ensure DOM is ready
    setTimeout(() => {
      const avatarImg = dom.avatarImg()
      if (avatarImg && data.avatar) {
        avatarImg.src = `/static/avatars/${data.avatar}`
        avatarImg.onerror = function() {
          this.src = '/static/avatars/default.png'
        }
      }
    }, 100)
  } catch (error) {
    console.error("[DEBUG] Error initializing user:", error)
  }
}

// Initialize after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initUser()
    initNavigation()
    showTab("chats")
  })
} else {
  initUser()
  initNavigation()
  showTab("chats")
}
