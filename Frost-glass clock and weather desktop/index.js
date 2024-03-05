import { clockRunning } from "./clock.js"
import { weatherObj } from "./weather.js"

// DEBUG Flag
window.DEBUG = true
// 全局变量
const clockTimer = 1000; // 时钟定时器


// 时钟
clockRunning()
setInterval(clockRunning, clockTimer)

// 天气
weatherObj.weatherInit()