const deg = 360 / (12 * 5),
    hr = document.querySelector("#hr"),
    mn = document.querySelector("#mn"),
    sc = document.querySelector("#sc")
    ;

export function clockRunning() {
    let date = new Date()
    let hh = date.getHours() * deg * 5
    let mm = date.getMinutes() * deg
    let ss = date.getSeconds() * deg

    hr.style.transform = `rotateZ(${hh + mm / 12}deg)`
    mn.style.transform = `rotateZ(${mm}deg)`
    sc.style.transform = `rotateZ(${ss}deg)`

    if (window.DEBUG) {
        console.log("时钟执行");
    }
}