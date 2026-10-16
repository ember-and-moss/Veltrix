'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const nav = [...document.querySelectorAll('.nav-item')];
  const views = [...document.querySelectorAll('.view')];
  const pageTitle = $('page-title');
  const pageTitles = { home: 'Übersicht', vault: 'Dateitresor', privacy: 'Sicherheit & Info' };
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const FORMAT = 'VELTRIX3';
  const ITERATIONS = 600000;
  const MAX_BYTES = 100 * 1024 * 1024;

  function showView(name) {
    views.forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
    nav.forEach(button => button.classList.toggle('active', button.dataset.view === name));
    pageTitle.textContent = pageTitles[name] || 'VELTRIX';
  }
  nav.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => showView(button.dataset.go)));

  function status(element, text, kind = '') {
    element.textContent = text;
    element.className = `status-message ${kind}`.trim();
  }
  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }
  function base64ToBytes(value) {
    const binary = atob(value);
    const result = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) result[i] = binary.charCodeAt(i);
    return result;
  }
  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  function safeFilename(name) {
    const cleaned = String(name || 'datei').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
    return cleaned || 'datei';
  }
  function checkCrypto() {
    return globalThis.crypto && globalThis.crypto.subtle && typeof globalThis.crypto.getRandomValues === 'function';
  }
  function setBusy(button, busy, label) {
    button.disabled = busy;
    button.dataset.originalLabel ||= button.querySelector('span').textContent;
    button.querySelector('span').textContent = busy ? label : button.dataset.originalLabel;
  }

  const encryptFile = $('encrypt-file');
  const encryptPassword = $('encrypt-password');
  const decryptFile = $('decrypt-file');
  const decryptPassword = $('decrypt-password');
  const encryptStatus = $('encrypt-status');
  const decryptStatus = $('decrypt-status');
  const encryptButton = $('encrypt-button');
  const decryptButton = $('decrypt-button');

  encryptButton.addEventListener('click', async () => {
    const file = encryptFile.files && encryptFile.files[0];
    const password = encryptPassword.value;
    if (!file) return status(encryptStatus, 'Bitte wähle zuerst eine Datei aus.', 'error');
    if (password.length < 12) return status(encryptStatus, 'Bitte verwende ein Passwort mit mindestens 12 Zeichen.', 'error');
    if (!checkCrypto()) return status(encryptStatus, 'Die Browser-Kryptografie ist nicht verfügbar. Öffne VELTRIX mit dem Startskript in Chrome oder Edge.', 'error');
    if (file.size > MAX_BYTES) return status(encryptStatus, 'Diese Version unterstützt Dateien bis 100 MB. Verwende für größere Dateien eine geprüfte Desktop-Lösung.', 'error');
    setBusy(encryptButton, true, 'Verschlüsselung läuft …');
    status(encryptStatus, 'Datei wird lokal verschlüsselt. Bitte warte …', 'busy');
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const header = {
        format: FORMAT,
        name: safeFilename(file.name),
        type: file.type || 'application/octet-stream',
        size: file.size,
        iterations: ITERATIONS,
        kdf: 'PBKDF2-SHA-256',
        cipher: 'AES-256-GCM',
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv)
      };
      // Authenticate the metadata too: changing the filename/type/header invalidates the ciphertext.
      const aad = encoder.encode(JSON.stringify(header));
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, key, await file.arrayBuffer());
      const blob = new Blob([encoder.encode(JSON.stringify(header) + '\n'), ciphertext], { type: 'application/octet-stream' });
      saveBlob(blob, safeFilename(file.name) + '.vltx');
      status(encryptStatus, 'Fertig. Die verschlüsselte Kopie wurde zum Download bereitgestellt. Das Original blieb unverändert.', 'success');
    } catch (error) {
      status(encryptStatus, 'Die Verschlüsselung ist fehlgeschlagen. Bitte teste mit einer unwichtigen Datei und prüfe, ob genug Speicher verfügbar ist.', 'error');
    } finally {
      setBusy(encryptButton, false);
    }
  });

  decryptButton.addEventListener('click', async () => {
    const file = decryptFile.files && decryptFile.files[0];
    const password = decryptPassword.value;
    if (!file) return status(decryptStatus, 'Bitte wähle zuerst eine .vltx-Datei aus.', 'error');
    if (!password) return status(decryptStatus, 'Bitte gib das Passwort ein.', 'error');
    if (!checkCrypto()) return status(decryptStatus, 'Die Browser-Kryptografie ist nicht verfügbar. Öffne VELTRIX mit dem Startskript in Chrome oder Edge.', 'error');
    if (file.size > MAX_BYTES + 4096) return status(decryptStatus, 'Diese Version unterstützt Dateien bis 100 MB.', 'error');
    setBusy(decryptButton, true, 'Entschlüsselung läuft …');
    status(decryptStatus, 'Datei wird lokal entschlüsselt. Bitte warte …', 'busy');
    try {
      const packed = new Uint8Array(await file.arrayBuffer());
      const newline = packed.indexOf(10);
      if (newline < 0 || newline > 16 * 1024) throw new Error('header');
      const headerText = decoder.decode(packed.subarray(0, newline));
      const header = JSON.parse(headerText);
      const ciphertext = packed.subarray(newline + 1);
      if (!header || !['VELTRIX3', 'VELTRIX1'].includes(header.format)) {
        throw new Error('format');
      }
      const salt = base64ToBytes(header.salt);
      const iv = base64ToBytes(header.iv);
      if (salt.length !== 16 || iv.length !== 12) throw new Error('header');
      const iterations = header.format === 'VELTRIX3' ? header.iterations : ITERATIONS;
      if (iterations !== ITERATIONS) throw new Error('iterations');
      const key = await deriveKey(password, salt);
      let plain;
      if (header.format === 'VELTRIX3') {
        plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(headerText), tagLength: 128 }, key, ciphertext);
      } else {
        // Legacy VELTRIX1 files used AES-GCM without additional authenticated metadata.
        plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, ciphertext);
      }
      const originalName = safeFilename(header.name || 'datei');
      saveBlob(new Blob([plain], { type: header.type || 'application/octet-stream' }), originalName);
      status(decryptStatus, 'Fertig. Die entschlüsselte Datei wurde zum Download bereitgestellt.', 'success');
    } catch (error) {
      status(decryptStatus, 'Entschlüsselung fehlgeschlagen: Passwort falsch, Datei beschädigt oder Dateiformat nicht unterstützt.', 'error');
    } finally {
      setBusy(decryptButton, false);
    }
  });

  if (!checkCrypto()) {
    status(encryptStatus, 'Hinweis: Die Browser-Kryptografie ist erst verfügbar, wenn die Seite in einem unterstützten Browserkontext läuft. Nutze START-VELTRIX.bat.', 'error');
  }
})();
