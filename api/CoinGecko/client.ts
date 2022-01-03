import got from 'got'
import { COINGECKO_BASE_URL } from '../../utils/constants'

const client = got.extend({
  prefixUrl: COINGECKO_BASE_URL,
})

export default client
