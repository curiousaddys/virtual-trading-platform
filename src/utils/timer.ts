export class Timer {
  start: number
  constructor() {
    this.start = Date.now()
  }
  log(message: string) {
    console.log(`${message} in ${Date.now() - this.start} ms.`)
    this.start = Date.now()
  }
}
