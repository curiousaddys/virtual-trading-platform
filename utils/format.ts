export const formatUSD = (num: number): string => {
  return (
    '$' +
    num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

export const formatFloat = (num: number): string => {
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 8,
  })
}

export const formatPercent = (num: number): string => {
  return (
    num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always',
    }) + '%'
  )
}

export const dateStringToTimestamp = (d: string): number => {
  return Math.floor(Date.parse(d) / 1000)
}
