import {
  isChrome,
  isMobile,
  isFirefox,
  isChromium,
  isEdge,
  isEdgeChromium,
} from 'react-device-detect'

export const isBrowserCompatible = (): boolean => {
  if (isMobile) {
    return false
  }
  return isChrome || isChromium || isFirefox || isEdge || isEdgeChromium
}

export const isEthereumObjectOnWindow = (): boolean =>
  !!(window as any)?.ethereum
