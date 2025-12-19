
console.log("APP.JS DEFINITELY LOADED");

import {state} from "./state.js"
import {fetchMe} from "./modules/api.js"
import { initNavigation, showTab } from "./modules/navigation.js"
import { dom } from "./utils/dom.js"

console.log("APP.JS LOADED")

async function initUser(){
  const data = await fetchMe()
  state.CURRENT_USER_ID = data.id
  state.CURRENT_USER_AVATAR = data.avatar

  const avatarImg = dom.avatarImg()
  if (avatarImg && data.avatar) {
    avatarImg.src = `/static/avatars/${data.avatar}`
  }
}

initUser()
initNavigation()
showTab("chats")
