import { state } from "../state.js"
import { dom } from "../utils/dom.js"
import { renderGroups } from "./groups.js"
import { loadGroupMessages, sendGroupMessage } from "./groupMessages.js"

export async function renderGroupChatView() {
  // Show top bar for group chat view
  const topBar = dom.topBar()
  if (!topBar) {
    console.error("[DEBUG groupChat] Top bar not found!")
    return
  }
  
  topBar.style.display = "flex"
  
  // Get group name from page title or use a default
  const pageTitleEl = dom.pageTitle()
  const groupName = (pageTitleEl && pageTitleEl.innerText) ? pageTitleEl.innerText : "Group Chat"
  
  // Check if user is a member
  let isMember = false
  try {
    const response = await fetch(`/groups/${state.ACTIVE_GROUP_ID}`, {
      credentials: "include"
    })
    if (response.ok) {
      const groupData = await response.json()
      isMember = true
      // Update group name from response if available
      if (groupData.name) {
        pageTitleEl.innerText = groupData.name
      }
    } else if (response.status === 403) {
      // User is not a member
      isMember = false
    }
  } catch (error) {
    console.error("[DEBUG groupChat] Error checking membership:", error)
    isMember = false
  }
  
  topBar.innerHTML = `
    <button class="back-button">
      <i class="fa-solid fa-arrow-left"></i>
      <span>Back</span>
    </button>
    <h2 class="chat-header-title">${groupName}</h2>
  `
  
  topBar.querySelector(".back-button").onclick = async () => {
    // Go back to the appropriate tab based on where we came from
    const { showTab } = await import("./navigation.js")
    
    if (state.CAME_FROM_GROUPS) {
      // If we came from groups page, go back to groups
      showTab("groups")
      const { renderGroups } = await import("./groups.js")
      await renderGroups()
      state.CAME_FROM_GROUPS = false  // Reset flag
    } else {
      // Otherwise go back to chats list
      showTab("chats")
      const { renderChats } = await import("./chats.js")
      await renderChats()
    }
  }
  
  const card = document.querySelector(".card")
  const bottomNav = document.querySelector(".bottom-nav")
  if (card) card.classList.add("chat-active")
  if (bottomNav) bottomNav.style.display = "none"
  
  dom.content().className = "app-content chat-active group-chat-active"
  
  // Always show chat interface, but disable input if not a member
  dom.content().innerHTML = `
    <div class="chat-window">
      <div class="messages" id="group-messages"></div>
      <div class="chat-input">
        <input id="group-message-input" placeholder="${isMember ? 'Type a message' : 'Join to send messages'}" ${isMember ? '' : 'disabled'}>
        ${!isMember ? `
          <button class="group-join-input-btn" id="join-group-input-btn">
            <i class="fa-solid fa-plus"></i>
            <span>Join</span>
          </button>
        ` : ''}
        <button id="group-send-button" ${isMember ? '' : 'style="display: none;"'}>↑</button>
      </div>
    </div>
  `
  
  // Try to load messages (even if not a member, they might be able to view)
  try {
    await loadGroupMessages(state.ACTIVE_GROUP_ID)
  } catch (error) {
    console.error("[DEBUG groupChat] Error loading messages (might not be a member):", error)
    // If not a member, show empty messages - that's okay
    const messagesDiv = document.getElementById("group-messages")
    if (messagesDiv && !isMember) {
      messagesDiv.innerHTML = `<p style="opacity:0.6; text-align:center; padding:20px;">Join the group to see messages</p>`
    }
  }
  
  // Setup join button if not a member
  if (!isMember) {
    const joinBtn = document.getElementById("join-group-input-btn")
    if (joinBtn) {
      joinBtn.onclick = async () => {
        try {
          const response = await fetch(`/groups/${state.ACTIVE_GROUP_ID}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
          })
          
          if (response.ok) {
            // IMPORTANT: Don't call renderGroups() or renderChats() as they will replace the content
            // Just reload the chat view (now as a member) - stays on chat screen
            // The group will appear in all-chats when user navigates there naturally
            await renderGroupChatView()
          } else {
            const data = await response.json().catch(() => ({}))
            alert(data.error || "Failed to join group")
          }
        } catch (error) {
          console.error("[DEBUG groupChat] Error joining group:", error)
          alert("Failed to join group. Please try again.")
        }
      }
    }
  } else {
    // Setup message sending if member
    const messageInput = document.getElementById("group-message-input")
    const sendButton = document.getElementById("group-send-button")
    
    const sendMessage = async () => {
      const content = messageInput.value.trim()
      if (!content) return
      
      messageInput.value = ""
      await sendGroupMessage(state.ACTIVE_GROUP_ID, content)
    }
    
    sendButton.onclick = sendMessage
    messageInput.onkeypress = (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    }
    
    // Focus input
    messageInput.focus()
  }
}

