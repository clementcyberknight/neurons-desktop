/**
 * Safely opens an external URL in the user's default web browser
 */
export function openWebsite(url = 'https://neurons.com') {
  if (typeof window !== 'undefined' && window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
