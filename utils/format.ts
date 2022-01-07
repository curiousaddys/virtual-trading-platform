export const formatUSD = (num: number, truncateCents: boolean = false): string => {
  return (
    '$' +
    num.toLocaleString('en-US', {
      minimumFractionDigits: truncateCents ? 0 : 2,
      maximumFractionDigits: truncateCents ? 0 : 2,
    })
  )
}

export const formatInt = (num: number): string => {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })
}

export const formatFloat = (num: number): string => {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 8,
  })
}

export const formatPercent = (num: number, displaySign: boolean = true): string => {
  return (
    num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: displaySign ? 'always' : 'never',
    }) + '%'
  )
}

export const dateStringToTimestamp = (d: string): number => {
  return Math.floor(Date.parse(d) / 1000)
}

export const stripHtmlTags = (s: string): string => {
  return s.replace(/<[^>]+>/g, '').replace(/\n/g, '<br />')
}
