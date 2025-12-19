import { state } from "../state.js"
import { fetchMessages, sendMessageApi } from "./api.js"
import { dom } from "../utils/dom.js"


export async function loadMessages() {
  if (!state.ACTIVE_CONVERSATION_ID) return

  const messages = await fetchMessages(state.ACTIVE_CONVERSATION_ID)
  const messagesDiv = dom.messages()

  // Store current scroll position to maintain it if needed
  const wasAtBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop <= messagesDiv.clientHeight + 100

  messagesDiv.innerHTML = ""

  // Use ID as secondary sort for messages with same timestamp
  // Sort oldest to newest (ascending) so newest appears at bottom
  messages.sort((a, b) => {
    const timeA = new Date(a.created_at || a.timestamp || 0).getTime()
    const timeB = new Date(b.created_at || b.timestamp || 0).getTime()
    if (timeA !== timeB) return timeA - timeB
    // If timestamps are equal, sort by ID (earlier messages have lower IDs)
    return (a.id || 0) - (b.id || 0)
  })
  
  console.log("[DEBUG] Messages sorted - first:", messages[0]?.content, "last:", messages[messages.length - 1]?.content)

  // Build all messages first, then add them all at once
  const fragment = document.createDocumentFragment()
  
  messages.forEach(msg => {
    const row = document.createElement("div")
    
    const avatar = msg.sender_avatar || (msg.sender_id === state.CURRENT_USER_ID ? state.CURRENT_USER_AVATAR : null)
    const avatarSrc = avatar ? `/static/avatars/${avatar}` : '/static/avatars/default.png'

    if (msg.sender_id === state.CURRENT_USER_ID) {
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
    fragment.appendChild(row)
  })
  
  // Add all messages at once
  messagesDiv.appendChild(fragment)
  
  console.log("[DEBUG] Added", messages.length, "messages to DOM")
  console.log("[DEBUG] First message in DOM:", messagesDiv.firstElementChild?.querySelector('.text')?.textContent?.trim())
  console.log("[DEBUG] Last message in DOM:", messagesDiv.lastElementChild?.querySelector('.text')?.textContent?.trim())
  console.log("[DEBUG] Container height:", messagesDiv.clientHeight, "scrollHeight:", messagesDiv.scrollHeight)
  
  // Force scroll to bottom - must happen after all messages are in DOM
  const forceScrollToBottom = () => {
    if (!messagesDiv) return
    
    const scrollHeight = messagesDiv.scrollHeight
    const clientHeight = messagesDiv.clientHeight
    
    // Use scrollTop = scrollHeight to go to absolute bottom
    messagesDiv.scrollTop = scrollHeight
    
    // Verify we actually scrolled
    const actualScroll = messagesDiv.scrollTop
    const isAtBottom = Math.abs(scrollHeight - actualScroll - clientHeight) < 5
    
    console.log("[DEBUG Scroll] scrollHeight:", scrollHeight, "clientHeight:", clientHeight, "scrollTop:", actualScroll, "isAtBottom:", isAtBottom)
    
    // If not at bottom, try scrollIntoView on last element
    if (!isAtBottom) {
      const lastRow = messagesDiv.lastElementChild
      if (lastRow) {
        lastRow.scrollIntoView({ block: 'end', behavior: 'auto' })
        console.log("[DEBUG Scroll] Used scrollIntoView on last message")
      }
    }
  }
  
  // Try multiple times to ensure it works
  forceScrollToBottom()
  setTimeout(forceScrollToBottom, 10)
  setTimeout(forceScrollToBottom, 50)
  setTimeout(forceScrollToBottom, 100)
  setTimeout(forceScrollToBottom, 200)
  setTimeout(forceScrollToBottom, 500)
  
  // Also use requestAnimationFrame
  requestAnimationFrame(() => {
    forceScrollToBottom()
    requestAnimationFrame(() => {
      forceScrollToBottom()
    })
  })
}


export async function sendMessage() {
  const input = document.getElementById("message-input")
  const text = input.value.trim()

  if (!text || !state.ACTIVE_CONVERSATION_ID) return

  input.value = ""
  
  await sendMessageApi(state.ACTIVE_CONVERSATION_ID, text)

  // Reload messages and scroll to bottom
  await loadMessages()
  
  // Ensure scroll happens after DOM update
  const messagesDiv = dom.messages()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      messagesDiv.scrollTop = messagesDiv.scrollHeight
    })
  })
}
