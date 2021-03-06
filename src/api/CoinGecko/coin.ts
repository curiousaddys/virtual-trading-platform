import CoinGeckoAPI from './client'

export interface GeckoDetails {
  id: string
  symbol: string
  name: string
  description: {
    en: string
  }
  links: {
    homepage?: string[] | null
    blockchain_site?: string[] | null
    official_forum_url?: string[] | null
    chat_url?: string[] | null
    announcement_url?: string[] | null
    twitter_screen_name: string
    facebook_username: string
    bitcointalk_thread_identifier?: null
    telegram_channel_identifier: string
    subreddit_url: string
    repos_url: {
      github?: string[] | null
      bitbucket?: null[] | null
    }
  }
  image: {
    thumb: string
    small: string
    large: string
  }
  country_origin: string
  genesis_date: string
  sentiment_votes_up_percentage: number
  sentiment_votes_down_percentage: number
  market_cap_rank: number
  coingecko_rank: number
  market_data: GeckoMarketData
  last_updated: string
}

interface GeckoMarketData {
  current_price: GeckoPrice
  ath: GeckoPrice
  ath_change_percentage: GeckoPrice
  ath_date: {
    usd: string
  }
  atl: GeckoPrice
  atl_change_percentage: GeckoPrice
  atl_date: {
    usd: string
  }
  market_cap: GeckoPrice
  market_cap_rank: number
  fully_diluted_valuation: GeckoPrice
  total_volume: GeckoPrice
  high_24h: GeckoPrice
  low_24h: GeckoPrice
  price_change_24h: number
  price_change_percentage_24h: number
  price_change_percentage_7d: number
  price_change_percentage_14d: number
  price_change_percentage_30d: number
  price_change_percentage_60d: number
  price_change_percentage_200d: number
  price_change_percentage_1y: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  price_change_24h_in_currency: GeckoPrice
  price_change_percentage_1h_in_currency: GeckoPrice
  price_change_percentage_24h_in_currency: GeckoPrice
  price_change_percentage_7d_in_currency: GeckoPrice
  price_change_percentage_14d_in_currency: GeckoPrice
  price_change_percentage_30d_in_currency: GeckoPrice
  price_change_percentage_60d_in_currency: GeckoPrice
  price_change_percentage_200d_in_currency: GeckoPrice
  price_change_percentage_1y_in_currency: GeckoPrice
  market_cap_change_24h_in_currency: GeckoPrice
  market_cap_change_percentage_24h_in_currency: GeckoPrice
  total_supply: number
  max_supply: number
  circulating_supply: number
  last_updated: string
}

interface GeckoPrice {
  // Add more currencies to this interface later if needed (out of scope as of Jan 2021).
  usd: number
}

export const fetchCoinDetails = async (coin: string): Promise<GeckoDetails> => {
  const path = `coins/${coin}`
  const params = {
    localization: false,
    tickers: false,
    community_data: false,
    developer_data: false,
  }
  return CoinGeckoAPI.get(path, { searchParams: params }).json<GeckoDetails>()
}
