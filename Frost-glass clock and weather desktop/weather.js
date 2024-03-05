import { tool } from "./tool.js";

// 获取信息状态：0 等待，1 成功，2 失败
const STATUS = {
    PENDING: 0,
    SUCCESS: 1,
    REJECT: 2
}

const WEATHER_ICON_BG_OFFSET = {
    "夜间多云": [10, 15],
    "夜间晴": [-800, 15],
    "夜间雾": [-1055, 15],
    "白天多云": [-5, -215],
    "白天晴": [-800, -215],
    "白天雾": [-1050, -215],
    "阴": [6, -450],
    "小雨": [-255, -450],
    "中雨": [-515, -450],
    "大雨": [-780, -450],
    "暴雨": [-1043, -450],
    "微风": [-1300, -450],
    "白天雷阵雨": [-250, -690],
    "夜间雷阵雨": [-512, -690],
    "小雪": [-775, -690],
    "中雪": [-1038, -690],
    "沙尘暴": [-1300, -690],
    "冰雹": [0, -935],
    "阵雪": [-260, -935],
    "阵雨": [-522, -935],
    "雨夹雪": [-785, -935],
    "强沙尘暴": [-1305, -935]
}

/* 全局变量 */
const weatherBaseUrl = "https://restapi.amap.com/v3/weather/weatherInfo",
    geographyBaseUrl = "https://restapi.amap.com/v3/geocode/geo",
    reGeographyBaseUrl = "https://restapi.amap.com/v3/geocode/regeo",
    key = "eaac85379c5ecdf44a27ffb3a332d3c0",
    sigKey = "7fc2b6beb9f1cc757d21c36b3346cc63",
    lnglatInterval = 500, // 经纬度定时器
    geoTimeout = 500, // 地理位置定时器
    weatherTimeout = 500, // 天气定时器
    geoThrottleDelay = 1000, // 节流最大时限
    maxRequestCount = 3, // 最大请求次数
    sunsetTime = "17:30:00",
    sunriseTime = "05:00:00"
    ;
/* 文档节点 */
const weatherIcon = $("div.weather-icon")[0],
    city = $("div.city")[0],
    weatherText = $("span.wea-text")[0],
    currentTemp = $("span.curr-temp")[0],
    windDirection = $("span.wind-direction")[0],
    windLevel = $("span.wind-level")[0],
    lunerDateText = $("span.lunar-date")[0],
    dateText = $("span.date")[0],
    locateBtn = $("div.locate")[0]
    ;

let handleGetLocation = false // 定位按钮可用状态
let geoRequestCount = 0, // 地理位置请求次数
    weatherRequestCount = 0 // 天气请求次数
    ;

const geoOptions = {
    enableHighAccuracy: true,
    timeout: 3000,
    maximumAge: 0
}

const defaultLocationAdcode = "220100"

let response = {
    lnglat: {
        status: void 0,
        info: {
            lnglat: void 0,
            timeStamp: void 0
        },
        err: {}
    },
    geoLocation: {
        status: void 0,
        info: {
            location: void 0
        },
        err: {}
    },
    weather: {
        status: void 0,
        info: {},
        err: {}
    },
}

// 计算数字签名
function getSignature(args) {
    let sig = "md5("
    let ascOrderKey = args ? Object.keys(args).sort() : []
    // 遍历key，拼签名
    ascOrderKey.forEach(i => {
        sig = sig + i + "=" + args[i]
        if (i !== ascOrderKey[ascOrderKey.length - 1]) {
            sig = sig + "&"
        }
    })
    sig += sigKey
    if (window.DEBUG) {
        console.log(sig);
    }
}

// 获取经纬度
function getLnglatLocation() {
    response.lnglat.status = STATUS.PENDING // 设为等待状态
    navigator.geolocation.getCurrentPosition(
        geoLnglatSuccessCallback,
        geoLnglatErrorCallback,
        geoOptions
    )
}

// 获取经纬度成功函数
function geoLnglatSuccessCallback(location) {
    response.lnglat.status = STATUS.SUCCESS // 设为成功状态
    // 获取经纬度
    const coords = location.coords
    const longitude = coords.longitude.toFixed(6)
    const latitude = coords.latitude.toFixed(6)
    const lnglat = longitude + "," + latitude
    // 获取时间戳
    let timeStamp = location.timestamp
    // 写入经纬度结果对象
    response.lnglat.info.lnglat = lnglat
    response.lnglat.info.timeStamp = timeStamp
}

// 获取经纬度失败函数
function geoLnglatErrorCallback(err) {
    response.lnglat.status = STATUS.REJECT // 设为失败状态
    // 写入经纬度失败对象
    response.lnglat.err = err
    if (window.DEBUG) {
        console.log("经纬度获取失败：", err.message);
    }
}

// 获取地理位置
async function getGeoLocation(location) {
    response.geoLocation.status = STATUS.PENDING // 设为等待状态
    // 发送请求
    $.ajax({
        type: "GET",
        url: reGeographyBaseUrl,
        async: true,
        data: {
            key,
            location,
            roadlevel: 0,
            radius: 3000,
            radius: "all"
        },
        success: geoSuccessCallback,
        error: geoErrorCallback
    })
}

// 获取地理位置成功函数
function geoSuccessCallback(res) {
    response.geoLocation.status = STATUS.SUCCESS // 设置成功状态
    if (window.DEBUG) {
        console.log(res.regeocode.addressComponent.adcode);
    }
    // 写入地理位置成功结果
    response.geoLocation.info.location = res.regeocode.addressComponent.adcode
}

// 获取地理位置失败函数
function geoErrorCallback(err) {
    response.geoLocation.status = STATUS.REJECT // 设置失败状态
    if (window.DEBUG) {
        console.log(err);
    }
    // 写入地理位置失败结果
    response.geoLocation.err = err
}

// 发送获取天气信息
async function getWeatherInfo(currentLocation) {
    response.weather.status = STATUS.PENDING // 设置等待状态
    // 发送请求
    $.ajax({
        type: "GET",
        url: weatherBaseUrl,
        async: true,
        data: {
            key,
            city: currentLocation ? currentLocation : defaultLocationAdcode
        },
        success: weatherSuccessCallback,
        error: weatherErrorCallback,
    })
}

// 获取天气成功函数
function weatherSuccessCallback(json) {
    response.weather.status = STATUS.SUCCESS // 设置成功状态
    response.weather.info = json // 写入json信息
}

// 获取天气失败函数
function weatherErrorCallback(xhr, status) {
    response.weather.status = STATUS.REJECT // 设置失败状态
    response.weather.err = { xhr, status } // 写入失败对象信息
}

// 请求天气节流函数
function geoThrottle(fn, delay) {
    let previous = 0
    return function () {
        let now = new Date()
        if (now - previous > delay && handleGetLocation) {
            fn.apply()
            previous = now
        }
    }
}

locateBtn.addEventListener("click", geoThrottle(weatherInit, geoThrottleDelay))

// 初始化
function weatherInit() {
    // 等待
    renderPendingWeather()
    // 获取地理经纬度
    getLnglatLocation()
    // 监听地理经纬度返回值
    listenLnglat()
}

// 经纬度监听函数 
function listenLnglat() {
    let lnglatTimer = void 0 // 定时器
    // 开启定时器，监听事件
    lnglatTimer = setInterval(() => {
        // 如果经纬度的状态为SUCCESS
        if (response.lnglat.status === STATUS.SUCCESS) {
            // 清除定时器
            clearInterval(lnglatTimer)
            // 获取位置信息
            listenGeography()
        }
        // 如果为REJECT
        else if (response.lnglat.status === STATUS.REJECT) {
            // 清除定时器
            clearInterval(lnglatTimer)
            // 抛出失败
            throwFailure()
        }

    }, lnglatInterval)
}

// 位置监听函数
function listenGeography() {
    let geoTimer = void 0 // 定时器
    // 执行获取地理位置函数
    getGeoLocation(response.lnglat.info.lnglat)
    // 开启定时器，监听事件
    geoTimer = setTimeout(() => {
        geoRequestCount++ // 计时器增加
        // 如果经纬度的状态为SUCCESS
        if (response.geoLocation.status === STATUS.SUCCESS) {
            if (window.DEBUG) {
                console.log("位置获取成功");
            }
            geoRequestCount = 0 // 定时器清零
            listenWeather() // 获取天气信息
        }
        // 如果为REJECT
        else if (response.geoLocation.status === STATUS.REJECT) {
            if (window.DEBUG) {
                console.log("位置获取失败", geoRequestCount);
            }
            // 未超过请求次数
            if (geoRequestCount !== maxRequestCount) {
                // 重新执行请求操作
                listenGeography()
            }
            // 超过请求次数
            else {
                // 抛出失败
                throwFailure()
            }
        }
    }, geoTimeout)
}

// 天气监听函数
function listenWeather() {
    let weatherTimer = void 0 // 定时器
    // 执行获取天气函数
    getWeatherInfo(response.geoLocation.info.location)
    // 开启定时器，监听事件
    weatherTimer = setTimeout(() => {
        weatherRequestCount++ // 计时器增加
        // 成功
        if (response.weather.status === STATUS.SUCCESS) {
            let weatherInfo = response.weather.info.lives[0]
            if (window.DEBUG) {
                console.log("天气信息获取成功", weatherInfo);
            }
            weatherRequestCount = 0 // 计时器清零
            // 渲染天气
            renderSuccessWeather(weatherInfo)
        }
        // 失败
        if (response.weather.status === STATUS.REJECT) {
            if (window.DEBUG) {
                console.log("天气获取失败");
            }
            // 未超过请求次数
            if (weatherRequestCount !== maxRequestCount) {
                // 重新请求
                listenWeather()
            }
            // 超过请求次数
            else {
                // 调用渲染超时函数
                renderFailWeather()
            }
        }
    }, weatherTimeout)
}

// 获取失败（除天气外）的操作
function throwFailure() {
    // 直接获取默认位置天气
    listenWeather()
    // 所有计时器清零
    geoRequestCount = 0
    weatherRequestCount = 0
}

// 渲染天气页面
function renderSuccessWeather(weatherData) {
    let dates = getLunarAndDateString()
    let weatherInfoObj = {
        city: weatherData.city,
        temperature: weatherData.temperature,
        weather: weatherData.weather,
        winddirection: weatherData.winddirection,
        windpower: weatherData.windpower,
        date: dates.CommonEra,
        lunarDate: dates.lunarDateString
    }
    renderTextPages(weatherInfoObj) // 渲染文字
    renderWeatherIcon(weatherData.weather) // 渲染天气图标
}

// 渲染失败页面
function renderFailWeather(data) {
    console.log("失败");
    let weatherInfoObj = {
        city: "获取天气信息失败，请检查网络是否畅通",
    }
    renderTextPages(weatherInfoObj)
}

// 渲染等待页面
function renderPendingWeather() {
    if (window.DEBUG) {
        console.log("等待");
    }
    let weatherInfoObj = {
        city: "定位中...",
        temperature: "未知",
        weather: "未知",
        winddirection: "未知",
        windpower: "未知"
    }
    /* 清除天气图标  */
    weatherIcon.style.backgroundPosition = "340px 150px"
    /* 渲染 */
    renderTextPages(weatherInfoObj)
}

// 渲染文字页面
function renderTextPages(weatherInfoObj) {
    // 定位按钮可用
    handleGetLocation = true
    // 写入城市
    city.innerText = weatherInfoObj.city ? weatherInfoObj.city : "未知"
    city.setAttribute("title", weatherInfoObj.city ? weatherInfoObj.city : "未知")
    // 写入天气
    weatherText.innerText = weatherInfoObj.weather ? weatherInfoObj.weather : "未知"
    // 写入温度
    currentTemp.innerText = weatherInfoObj.temperature ? weatherInfoObj.temperature : "未知"
    // 写入风向
    windDirection.innerText = weatherInfoObj.winddirection ? weatherInfoObj.winddirection : "未知"
    // 写入风力
    windLevel.innerText = weatherInfoObj.windpower ? weatherInfoObj.windpower : "未知"
    // 写入公历日期
    dateText.innerText = weatherInfoObj.date ? weatherInfoObj.date : "年月日"
    // 写入农历日期
    lunerDateText.innerText = weatherInfoObj.lunarDate ? weatherInfoObj.lunarDate : "农历年 月日"
}

// 获取（农历）日期字符串
function getLunarAndDateString() {
    // 日期
    // 公历日期
    let currentDate = new Date()
    let CommonEra = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`
    // 农历日期
    let lunarDateVal = tool.getChineseDate() // 获取农历日期
    let lunarDateString = `农历${lunarDateVal.tianGanDizhi}${lunarDateVal.shengXiao}年 ${lunarDateVal.yue}月${lunarDateVal.ri}`
    return { CommonEra, lunarDateString }
}

// 天气图标渲染
function renderWeatherIcon(weather) {
    let weatherBgOffset // 天气背景偏移量
    let weatherString // 天气字符串
    // 如果为：多云，晴，雾，雷阵雨，区分黑白天
    if (weather === "多云" || weather === "晴" || weather === "雾" || weather === "雷阵雨") {
        let day = CalDayANight()
        weatherString = day + weather
    }
    // 如果为其他，不区分黑白天
    else {
        weatherString = weather
    }
    // 根据天气字符串，查找天气图标背景偏移量列表
    let iconOffset = WEATHER_ICON_BG_OFFSET[weatherString]
    let iconOffsetX = iconOffset[0]
    let iconOffsetY = iconOffset[1]
    if (window.DEBUG) {
        console.log(iconOffset);
    }
    // 渲染天气图标
    weatherIcon.style.backgroundPosition = `${iconOffsetX}px ${iconOffsetY}px`

}

// 判断黑白天
function CalDayANight() {
    // 获取当前时间
    let currentDate = new Date()
    let currentHour = currentDate.getHours()
    let currentMinute = currentDate.getMinutes()
    let currentSecond = currentDate.getSeconds()
    let currentTime = `${currentHour}:${currentMinute}:${currentSecond}`
    // 进行时间比较
    if (window.DEBUG) {
        console.log("times", tool.timeStamp(currentTime), tool.timeStamp(sunriseTime), tool.timeStamp(sunsetTime));
    }
    if (tool.timeStamp(currentTime) >= tool.timeStamp(sunriseTime) && tool.timeStamp(currentTime) < tool.timeStamp(sunsetTime)) {
        // 白天
        if (window.DEBUG) {
            console.log("白天");
        }
        return "白天"
    } else {
        // 黑夜
        if (window.DEBUG) {
            console.log("黑夜");
        }
        return "夜间"
    }


}

const weatherObj = {
    weatherInit
}

export { weatherObj }