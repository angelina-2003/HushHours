import { state } from "../state.js"
import { fetchConversations } from "./api.js"
import { loadMessages, sendMessage } from "./messages.js"
import { dom } from "../utils/dom.js"

export async function renderChats() {
  dom.topBar().innerHTML = `
    <div class="top-nav">
      <i class="fa-solid fa-comments active" data-mode="all"></i>
      <i class="fa-solid fa-users" data-mode="groups"></i>
      <i class="fa-solid fa-user-lock" data-mode="private"></i>
      <i class="fa-solid fa-heart" data-mode="favourites"></i>
    </div>
  `

  setupTopNav()

  const card = document.querySelector(".card")
  const bottomNav = document.querySelector(".bottom-nav")
  if (card) card.classList.remove("chat-active")
  if (bottomNav) bottomNav.style.display = "flex"

  dom.content().className = "app-content"
  dom.content().innerHTML = `<div class="chat-list" id="chat-list"></div>`

  const conversations = await fetchConversations()
  state.allConversations = conversations

  const list = dom.chatList()

  if (conversations.length === 0) {
    list.innerHTML = `<p style="text-align:center; opacity:0.6;">No chats yet</p>`
    return
  }

  displayConversations(conversations, list)
}

function displayConversations(conversations, list) {
  list.innerHTML = ""

  conversations.forEach(conv => {
    const item = document.createElement("div")
    item.className = "chat-item"

    const preview = conv.last_message_content || "Tap to open chat"

    item.innerHTML = `
      <img class="chat-avatar" src="/static/avatars/${conv.other_avatar}">
      <div class="chat-meta">
        <div class="chat-name">${conv.other_username}</div>
        <div class="chat-preview">${preview}</div>
      </div>
    `

    item.onclick = () => {
      state.ACTIVE_CONVERSATION_ID = conv.conversation_id
      dom.pageTitle().innerText = conv.other_username
      renderChatView()
    }

    list.appendChild(item)
  })
}

function renderChatView() {
  dom.topBar().innerHTML = `
    <button class="back-button">
      <i class="fa-solid fa-arrow-left"></i>
      <span>Back</span>
    </button>
  `

  dom.topBar().querySelector(".back-button").onclick = renderChats

  const card = document.querySelector(".card")
  const bottomNav = document.querySelector(".bottom-nav")
  if (card) card.classList.add("chat-active")
  if (bottomNav) bottomNav.style.display = "none"

  dom.content().className = "app-content chat-active"
  dom.content().innerHTML = `
    <div class="chat-window">
      <div class="messages" id="messages"></div>
      <div class="chat-input">
        <input id="message-input" placeholder="Type a message">
        <button id="send-button">↑</button>
      </div>
    </div>
  `

  document.getElementById("send-button").onclick = sendMessage
  document.getElementById("message-input").onkeypress = e => {
    if (e.key === "Enter") sendMessage()
  }

  loadMessages()
}

function setupTopNav() {
  const icons = document.querySelectorAll(".top-nav i")

  icons.forEach(icon => {
    icon.onclick = () => {
      icons.forEach(i => i.classList.remove("active"))
      icon.classList.add("active")
      filterChats(icon.dataset.mode)
    }
  })
}

function filterChats(mode) {
  const list = dom.chatList()
  if (!list) return

  if (mode === "all" || mode === "private") {
    displayConversations(state.allConversations, list)
  } else if (mode === "groups") {
    list.innerHTML = "<p style='opacity:0.6; text-align:center; padding:40px;'>Group chats coming soon</p>"
  } else {
    list.innerHTML = "<p style='opacity:0.6; text-align:center; padding:40px;'>Favourite chats coming soon</p>"
  }
}
