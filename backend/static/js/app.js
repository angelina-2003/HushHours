const content = document.getElementById("app-content")
const navItems = document.querySelectorAll(".nav-item")
const topBar = document.getElementById("top-bar")

let ACTIVE_CONVERSATION_ID = null
let ACTIVE_OTHER_USER_ID = null

navItems.forEach(item => {
  item.onclick = () => {
    navItems.forEach(i => i.classList.remove("active"))
    item.classList.add("active")

    showTab(item.dataset.tab)
  }
})


const pageTitle = document.getElementById("page-title")

function showTab(tab) {
  if (tab === "chats") {
    pageTitle.innerText = "My Chats"
    renderChats()
  }

  if (tab === "groups") {
    pageTitle.innerText = "Groups"
    renderGroups()
  }

  if (tab === "avatar") {
    pageTitle.innerText = "Your Avatar"
    renderAvatar()
  }

  if (tab === "friends") {
    pageTitle.innerText = "Diary"
    renderFriends()
  }

  if (tab === "settings") {
    pageTitle.innerText = "Settings"
    renderSettings()
  }
}





let CURRENT_USER_ID = null
let CURRENT_USER_AVATAR = null

fetch("/me", { credentials: "include" })
  .then(res => res.json())
  .then(data => {
    CURRENT_USER_ID = data.id
    CURRENT_USER_AVATAR = data.avatar

    const avatarImg = document.querySelector(".avatar-nav img")
    if (avatarImg && data.avatar) {
      avatarImg.src = `/static/avatars/${data.avatar}`
    }
})


let allConversations = []

async function renderChats() {
  topBar.innerHTML = `
    <div class="top-nav">
      <i class="fa-solid fa-comments active" data-mode="all"></i>
      <i class="fa-solid fa-users" data-mode="groups"></i>
      <i class="fa-solid fa-user-lock" data-mode="private"></i>
      <i class="fa-solid fa-heart" data-mode="favourites"></i>
    </div>
  `

  // Setup top nav event listeners
  setupTopNav()

  // Show bottom nav when returning to chats
  const card = document.querySelector(".card")
  const bottomNav = document.querySelector(".bottom-nav")
  if (card) {
    card.classList.remove("chat-active")
  }
  if (bottomNav) {
    bottomNav.style.display = "flex"
  }

  content.className = "app-content"
  content.innerHTML = `
    <div class="chat-list" id="chat-list"></div>
  `

  const res = await fetch("/conversations", {
    credentials: "include"
  })

  const conversations = await res.json()
  console.log("Conversations received:", conversations)
  console.log("Current user ID:", CURRENT_USER_ID)

  // Store all conversations for filtering
  allConversations = conversations

  const list = document.getElementById("chat-list")

  if (conversations.length === 0) {
    list.innerHTML = `
      <p style="text-align:center; opacity:0.6;">
        No chats yet
      </p>
    `
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
      ACTIVE_CONVERSATION_ID = conv.conversation_id
      pageTitle.innerText = conv.other_username
      renderChatView()
    }

    list.appendChild(item)
  })
}

function renderChatView() {
  topBar.innerHTML = `
    <button class="back-button" onclick="renderChats()">
      <i class="fa-solid fa-arrow-left"></i>
      <span>Back</span>
    </button>
  `

  // Hide bottom nav when chat is active
  const card = document.querySelector(".card")
  const bottomNav = document.querySelector(".bottom-nav")
  if (card) {
    card.classList.add("chat-active")
  }
  if (bottomNav) {
    bottomNav.style.display = "none"
  }

  content.className = "app-content chat-active"
  content.innerHTML = `
    <div class="chat-window">
      <div class="messages" id="messages"></div>

      <div class="chat-input">
        <input id="message-input" placeholder="Type a message">
        <button id="send-button">↑</button>
      </div>
    </div>
  `

  document
    .getElementById("send-button")
    .addEventListener("click", sendMessage)

  document
    .getElementById("message-input")
    .addEventListener("keypress", e => {
      if (e.key === "Enter") sendMessage()
    })

  loadMessages()
}




function renderGroups() {
  topBar.innerHTML = "<h3 style='text-align:center'>Groups</h3>"
  content.innerHTML = ""
}

function renderAvatar() {
  topBar.innerHTML = "<h3 style='text-align:center'>Avatar</h3>"
  content.innerHTML = ""
}

function renderFriends() {
  topBar.innerHTML = "<h3 style='text-align:center'>Friends</h3>"
  content.innerHTML = ""
}

function renderSettings() {
  topBar.innerHTML = "<h3 style='text-align:center'>Settings</h3>"
  content.innerHTML = ""
}


function setupTopNav() {
  const icons = document.querySelectorAll(".top-nav i")

  icons.forEach(icon => {
    icon.onclick = () => {
      icons.forEach(i => i.classList.remove("active"))
      icon.classList.add("active")

      const mode = icon.dataset.mode
      filterChats(mode)
    }
  })
}

function filterChats(mode) {
  const list = document.getElementById("chat-list")

  if (!list) return

  // For now, all modes show all chats (you can implement filtering later)
  // But at least show the conversations instead of just placeholder text
  if (mode === "all") {
    displayConversations(allConversations, list)
  } else if (mode === "groups") {
    list.innerHTML = "<p style='opacity:0.6; text-align:center; padding: 40px;'>Group chats coming soon</p>"
  } else if (mode === "private") {
    displayConversations(allConversations, list)
  } else if (mode === "favourites") {
    list.innerHTML = "<p style='opacity:0.6; text-align:center; padding: 40px;'>Favourite chats coming soon</p>"
  }
}


function openChat(conversation) {
  const { conversation_id, other_username, other_avatar } = conversation

  // Update page title
  pageTitle.innerText = other_username

  // Clear top bar (or later we can customize it)
  topBar.innerHTML = `
    <div class="top-nav">
      <i class="fa-solid fa-arrow-left" id="back-to-chats"></i>
    </div>
  `

  // Inject chat screen
  content.innerHTML = `
    <div class="chat-screen">
      <div class="messages" id="messages"></div>

      <div class="chat-input">
        <input
          type="text"
          id="message-input"
          placeholder="Type a message"
          autocomplete="off"
        />
        <button id="send-message">↑</button>
      </div>
    </div>
  `
}



async function loadMessages() {
  if (!ACTIVE_CONVERSATION_ID) return

  const res = await fetch(
    `/conversations/${ACTIVE_CONVERSATION_ID}/messages`,
    { credentials: "include" }
  )

  const messages = await res.json()
  const messagesDiv = document.getElementById("messages")

  messagesDiv.innerHTML = ""

  // Sort messages by timestamp to ensure chronological order
  // Use ID as secondary sort for messages with same timestamp
  messages.sort((a, b) => {
    const timeA = new Date(a.created_at || a.timestamp || 0).getTime()
    const timeB = new Date(b.created_at || b.timestamp || 0).getTime()
    if (timeA !== timeB) {
      return timeA - timeB
    }
    // If timestamps are equal, sort by ID (earlier messages have lower IDs)
    return (a.id || 0) - (b.id || 0)
  })

  messages.forEach(msg => {
    const row = document.createElement("div")
    
    // Get avatar - use sender_avatar from message, or fallback to current user's avatar for outgoing
    const avatar = msg.sender_avatar || (msg.sender_id === CURRENT_USER_ID ? CURRENT_USER_AVATAR : null)
    const avatarSrc = avatar ? `/static/avatars/${avatar}` : '/static/avatars/default.png'

    if (msg.sender_id === CURRENT_USER_ID) {
      row.className = "message-row outgoing-row"
      row.innerHTML = `
        <div class="message outgoing">
          <p class="text">${msg.content}</p>
        </div>
        <img class="message-avatar" src="${avatarSrc}" alt="Avatar" onerror="this.src='/static/avatars/default.png'">
      `
    } else {
      row.className = "message-row incoming-row"
      row.innerHTML = `
        <img class="message-avatar" src="${avatarSrc}" alt="Avatar" onerror="this.src='/static/avatars/default.png'">
        <div class="message incoming">
          <p class="text">${msg.content}</p>
        </div>
      `
    }

    messagesDiv.appendChild(row)
  })

  messagesDiv.scrollTop = messagesDiv.scrollHeight
}



function setupSendMessage() {
  const input = document.getElementById("message-input")
  const button = document.getElementById("send-button")

  button.onclick = sendMessage
  input.onkeypress = e => {
    if (e.key === "Enter") sendMessage()
  }
}
async function sendMessage() {
  const input = document.getElementById("message-input")
  const text = input.value.trim()

  if (!text || !ACTIVE_CONVERSATION_ID) return

  await fetch("/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      conversation_id: ACTIVE_CONVERSATION_ID,
      content: text
    })
  })

  input.value = ""
  loadMessages()
}



// default screen
showTab("chats")

