/**
 * WhatsApp Review Chat Generator
 * Logic, Dynamic Slot Sequencer & HD PNG Exporter
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Page Elements
  const pageGenerator = document.getElementById('page-generator');
  const pagePreview = document.getElementById('page-preview');

  // Page 1 Control Inputs
  const inputPhone = document.getElementById('input-phone');
  const inputSubtitle = document.getElementById('input-subtitle');
  const inputStatusTime = document.getElementById('input-status-time');
  const inputNetworkSpeed = document.getElementById('input-network-speed');
  const inputBattery = document.getElementById('input-battery');
  const inputAvatarUrl = document.getElementById('input-avatar-url');
  const inputAvatarFile = document.getElementById('input-avatar-file');
  const inputChatDate = document.getElementById('input-chat-date');

  const countClientInput = document.getElementById('count-client');
  const countYouInput = document.getElementById('count-you');
  const btnGenerateSlots = document.getElementById('btn-generate-slots');
  const btnAddSingle = document.getElementById('btn-add-single');
  const slotsContainer = document.getElementById('bubble-slots-container');
  const slotsCountBadge = document.getElementById('slots-count-badge');
  const btnPrintResult = document.getElementById('btn-print-result');

  // Page 2 Preview Elements
  const btnBackToEdit = document.getElementById('btn-back-to-edit');
  const btnDownloadImage = document.getElementById('btn-download-image');
  const btnTriggerPrint = document.getElementById('btn-trigger-print');

  const displayStatusTime = document.getElementById('display-status-time');
  const displayStatusSpeed = document.getElementById('display-status-speed');
  const displayBatteryLevel = document.getElementById('display-battery-level');
  const batteryFill = document.getElementById('battery-fill');

  const displayContactName = document.getElementById('display-contact-name');
  const displayContactSubtitle = document.getElementById('display-contact-subtitle');
  const displayAvatarImg = document.getElementById('display-avatar-img');
  const displayAvatarDefault = document.getElementById('display-avatar-default');
  const displayChatDate = document.getElementById('display-chat-date');
  const messagesContainer = document.getElementById('messages-container');
  const whatsappScreen = document.getElementById('whatsapp-screen');

  // Local state for custom uploaded avatar
  let customAvatarDataUrl = '';

  // SVG for WhatsApp Double Blue Ticks
  const doubleBlueTicksSVG = `
    <span class="bubble-ticks" title="Read">
      <svg viewBox="0 0 16 11" width="16" height="11" fill="none">
        <path d="M11.5 1L5.9 6.6 3.3 4 2.1 5.2l3.8 3.8 6.8-6.8L11.5 1z" fill="#53BDEB"/>
        <path d="M15.3 1L9.7 6.6 8.3 5.2 7.1 6.4l2.6 2.6 6.8-6.8L15.3 1z" fill="#53BDEB"/>
      </svg>
    </span>
  `;

  // SVG for Single Grey Tick
  const singleTickSVG = `
    <span class="bubble-ticks" style="color:#8696A0;" title="Sent">
      <svg viewBox="0 0 16 11" width="16" height="11" fill="none">
        <path d="M12.5 1L5.9 7.6 3.3 5 2.1 6.2l3.8 3.8 7.8-7.8L12.5 1z" fill="#8696A0"/>
      </svg>
    </span>
  `;

  // Default sample messages
  const defaultMessages = [
    { sender: 'client', text: 'Salam brother, I just received my parcel! The quality is amazing 🔥', time: '8:02' },
    { sender: 'you', text: 'Walaikum Assalam! Thank you so much for the feedback. Really glad you loved it! 😊', time: '8:03' },
    { sender: 'client', text: 'Will definitely recommend to all my friends. 10/10 service!', time: '8:03' },
    { sender: 'you', text: 'Always happy to serve! Let us know whenever you need anything else.', time: '8:04' }
  ];

  /**
   * Initialize default slots or restore from memory
   */
  function init() {
    renderSlotsFromData(defaultMessages);
    setupEventListeners();
  }

  /**
   * Render dynamic slot cards in Page 1
   */
  function renderSlotsFromData(messages) {
    slotsContainer.innerHTML = '';
    messages.forEach((msg, index) => {
      createSlotElement(msg.sender, msg.text, msg.time, index + 1);
    });
    updateSlotsBadge();
  }

  /**
   * Create an individual slot DOM element
   */
  function createSlotElement(sender = 'client', text = '', time = '8:02', slotIndex = 1) {
    const isClient = sender === 'client';
    const slotDiv = document.createElement('div');
    slotDiv.className = `bubble-slot-item ${isClient ? 'client-slot' : 'you-slot'}`;

    slotDiv.innerHTML = `
      <div class="slot-top-row">
        <span class="slot-tag">Bubble #${slotIndex}: ${isClient ? 'Client (Incoming)' : 'You (Outgoing)'}</span>
        <div class="slot-controls">
          <select class="slot-sender-select">
            <option value="client" ${isClient ? 'selected' : ''}>Client (Left / Grey)</option>
            <option value="you" ${!isClient ? 'selected' : ''}>You (Right / Green)</option>
          </select>
          <input type="text" class="slot-time-input" value="${escapeHtml(time)}" placeholder="Time">
          <button type="button" class="btn-remove-slot" title="Remove bubble">✕</button>
        </div>
      </div>
      <textarea class="slot-textarea" placeholder="Type chat message here...">${escapeHtml(text)}</textarea>
    `;

    // Sender change event
    const senderSelect = slotDiv.querySelector('.slot-sender-select');
    const slotTag = slotDiv.querySelector('.slot-tag');
    senderSelect.addEventListener('change', (e) => {
      const newSender = e.target.value;
      if (newSender === 'client') {
        slotDiv.classList.remove('you-slot');
        slotDiv.classList.add('client-slot');
        slotTag.textContent = `Bubble #${slotIndex}: Client (Incoming)`;
      } else {
        slotDiv.classList.remove('client-slot');
        slotDiv.classList.add('you-slot');
        slotTag.textContent = `Bubble #${slotIndex}: You (Outgoing)`;
      }
    });

    // Remove slot event
    const btnRemove = slotDiv.querySelector('.btn-remove-slot');
    btnRemove.addEventListener('click', () => {
      slotDiv.remove();
      reindexSlots();
      updateSlotsBadge();
    });

    slotsContainer.appendChild(slotDiv);
  }

  /**
   * Re-index slot titles
   */
  function reindexSlots() {
    const slots = slotsContainer.querySelectorAll('.bubble-slot-item');
    slots.forEach((slot, idx) => {
      const select = slot.querySelector('.slot-sender-select');
      const tag = slot.querySelector('.slot-tag');
      const isClient = select.value === 'client';
      tag.textContent = `Bubble #${idx + 1}: ${isClient ? 'Client (Incoming)' : 'You (Outgoing)'}`;
    });
  }

  /**
   * Update the badge showing total slots
   */
  function updateSlotsBadge() {
    const count = slotsContainer.querySelectorAll('.bubble-slot-item').length;
    slotsCountBadge.textContent = `${count} ${count === 1 ? 'Bubble' : 'Bubbles'}`;
  }

  /**
   * Generate slots based on numeric inputs
   */
  function handleGenerateSlots() {
    const clientCount = parseInt(countClientInput.value, 10) || 0;
    const youCount = parseInt(countYouInput.value, 10) || 0;
    const total = clientCount + youCount;

    if (total <= 0) {
      alert('Please enter at least 1 bubble for client or you.');
      return;
    }

    slotsContainer.innerHTML = '';
    let currentClient = 0;
    let currentYou = 0;
    let minutesOffset = 2;

    // Alternate gracefully between client and you
    for (let i = 0; i < total; i++) {
      let sender = 'client';
      if (currentClient < clientCount && (currentYou >= youCount || i % 2 === 0)) {
        sender = 'client';
        currentClient++;
      } else if (currentYou < youCount) {
        sender = 'you';
        currentYou++;
      } else {
        sender = 'client';
      }

      const formattedMin = String(minutesOffset).padStart(2, '0');
      const timeStr = `8:${formattedMin}`;
      createSlotElement(sender, '', timeStr, i + 1);

      if (i % 2 === 1) minutesOffset++;
    }

    updateSlotsBadge();
  }

  /**
   * Add a single bubble slot
   */
  function handleAddSingleSlot() {
    const existingCount = slotsContainer.querySelectorAll('.bubble-slot-item').length;
    const lastSlot = slotsContainer.lastElementChild;
    let nextSender = 'client';
    let nextTime = '8:05';

    if (lastSlot) {
      const lastSender = lastSlot.querySelector('.slot-sender-select').value;
      nextSender = lastSender === 'client' ? 'you' : 'client';
      nextTime = lastSlot.querySelector('.slot-time-input').value || '8:05';
    }

    createSlotElement(nextSender, '', nextTime, existingCount + 1);
    updateSlotsBadge();
  }

  /**
   * Handle avatar file upload
   */
  function handleAvatarFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        customAvatarDataUrl = event.target.result;
        inputAvatarUrl.value = ''; // clear text if file used
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Collect all data and render Page 2 (WhatsApp Screen)
   */
  function handlePrintResult() {
    // 1. Sync Status Bar
    displayStatusTime.textContent = inputStatusTime.value.trim() || '8:02';
    
    const speedVal = inputNetworkSpeed.value.trim() || '0.54 KB/s';
    const speedParts = speedVal.split(' ');
    if (speedParts.length === 2) {
      displayStatusSpeed.innerHTML = `${escapeHtml(speedParts[0])}<br><small>${escapeHtml(speedParts[1])}</small>`;
    } else {
      displayStatusSpeed.innerHTML = escapeHtml(speedVal);
    }

    const batteryVal = Math.min(100, Math.max(1, parseInt(inputBattery.value, 10) || 23));
    if (displayBatteryLevel) displayBatteryLevel.textContent = batteryVal;
    if (batteryFill) batteryFill.style.width = `${batteryVal}%`;

    // 2. Sync Chat Header
    displayContactName.textContent = inputPhone.value.trim() || '+49 1521 2217961';
    displayContactSubtitle.textContent = inputSubtitle.value.trim() || 'Business Account';
    displayChatDate.textContent = inputChatDate.value.trim() || 'Today';

    // 3. Avatar logic
    const directUrl = inputAvatarUrl.value.trim();
    if (customAvatarDataUrl) {
      displayAvatarImg.src = customAvatarDataUrl;
      displayAvatarImg.style.display = 'block';
      displayAvatarDefault.style.display = 'none';
    } else if (directUrl) {
      displayAvatarImg.src = directUrl;
      displayAvatarImg.style.display = 'block';
      displayAvatarDefault.style.display = 'none';
    } else {
      displayAvatarImg.style.display = 'none';
      displayAvatarDefault.style.display = 'flex';
    }

    // 4. Render Chat Bubbles
    messagesContainer.innerHTML = '';
    const slotElements = slotsContainer.querySelectorAll('.bubble-slot-item');

    slotElements.forEach((slot) => {
      const sender = slot.querySelector('.slot-sender-select').value;
      const time = slot.querySelector('.slot-time-input').value.trim() || '8:02';
      const text = slot.querySelector('.slot-textarea').value.trim();

      if (!text) return; // Skip completely empty bubbles

      const bubbleDiv = document.createElement('div');
      const isClient = sender === 'client';
      bubbleDiv.className = `chat-bubble ${isClient ? 'incoming' : 'outgoing'}`;

      const incomingTailSVG = `<svg class="bubble-tail-svg incoming-tail" viewBox="0 0 8 13" width="8" height="13"><path d="M1.533 3.568L8 12.193V0H2.812C1.042 0 .474 2.156 1.533 3.568z" fill="#202C33"/></svg>`;
      const outgoingTailSVG = `<svg class="bubble-tail-svg outgoing-tail" viewBox="0 0 8 13" width="8" height="13"><path d="M6.467 3.568L0 12.193V0h5.188c1.77 0 2.338 2.156 1.279 3.568z" fill="#005C4B"/></svg>`;

      bubbleDiv.innerHTML = `
        ${isClient ? incomingTailSVG : ''}
        <span class="bubble-content">${escapeHtml(text)}</span>
        <div class="bubble-meta">
          <span class="bubble-time">${escapeHtml(time)}</span>
          ${!isClient ? doubleBlueTicksSVG : ''}
        </div>
        ${!isClient ? outgoingTailSVG : ''}
      `;

      messagesContainer.appendChild(bubbleDiv);
    });

    // 5. Switch view to Page 2
    pageGenerator.classList.remove('active');
    pagePreview.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Switch back to Page 1 (Edit Mode)
   */
  function handleBackToEdit() {
    pagePreview.classList.remove('active');
    pageGenerator.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Export high-resolution PNG using html2canvas
   */
  async function handleDownloadPNG() {
    if (typeof html2canvas === 'undefined') {
      alert('html2canvas library is loading or blocked. You can take a direct screenshot using Snipping Tool or Print Dialog.');
      return;
    }

    btnDownloadImage.textContent = '⏳ Rendering HD PNG...';
    btnDownloadImage.disabled = true;

    try {
      const canvas = await html2canvas(whatsappScreen, {
        scale: 3, // 3x retina quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0B141A',
        scrollX: 0,
        scrollY: 0
      });

      const imageURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imageURL;
      const cleanPhone = (inputPhone.value.trim() || 'whatsapp').replace(/[^a-zA-Z0-9]/g, '_');
      downloadLink.download = `whatsapp_review_${cleanPhone}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Error rendering image:', err);
      alert('Could not auto-download image. You can capture a direct screenshot using Windows Snipping Tool (Win + Shift + S).');
    } finally {
      btnDownloadImage.textContent = '📸 Download HD PNG';
      btnDownloadImage.disabled = false;
    }
  }

  /**
   * Helper: Escape HTML string to avoid injection
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Attach all DOM Event Listeners
   */
  function setupEventListeners() {
    btnGenerateSlots.addEventListener('click', handleGenerateSlots);
    btnAddSingle.addEventListener('click', handleAddSingleSlot);
    inputAvatarFile.addEventListener('change', handleAvatarFileUpload);
    btnPrintResult.addEventListener('click', handlePrintResult);
    btnBackToEdit.addEventListener('click', handleBackToEdit);
    btnDownloadImage.addEventListener('click', handleDownloadPNG);
    btnTriggerPrint.addEventListener('click', () => window.print());
  }

  // Run initialization
  init();
});
