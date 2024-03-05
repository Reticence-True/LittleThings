import { drawClock } from "./drawClock.js";

var canvas = document.getElementById("canvas"),
    context = canvas.getContext('2d'),
    snapshotButton = document.getElementById("snapshotButton"),
    snapshotImageElement = document.getElementById("snapshotImageElement"),
    snapshotList = document.querySelector(".snapshotList"),
    loop,
    throttle = true;

loop = setInterval(() => {
    drawClock(canvas);
}, 1000);

function addItem2snapshotList(dataUrl) {
    let snapshotItem = document.createElement("li");
    let snapshotItemImg = document.createElement("img");

    snapshotItem.setAttribute("class", "snapshotItem");
    snapshotItemImg.setAttribute("class", "snapshotItemImg");
    snapshotItemImg.setAttribute("src", dataUrl);
    snapshotItemImg.style.width = "250px";
    snapshotItemImg.style.height = "250px";
    snapshotItemImg.style.border = "thin solid #000";
    snapshotItemImg.style.borderRadius = "50%";


    snapshotItem.appendChild(snapshotItemImg);

    takeSnapshotAnimation(dataUrl, snapshotItem);
}

function takeSnapshotAnimation(dataUrl, snapshotItem) {
    snapshotImageElement.src = dataUrl;
    snapshotImageElement.style.display = "inline";
    snapshotImageElement.style.animationPlayState = "running";
    setTimeout(() => {
        snapshotImageElement.style.animationPlayState = "pause";
        snapshotImageElement.style.display = "none";
        snapshotList.appendChild(snapshotItem);
    }, 2000)
}

snapshotButton.addEventListener("click", () => {
    var dataUrl;

    console.log(throttle);

    /* 节流 */
    if (throttle) {
        throttle = false;
        if (snapshotButton.value === "抓取快照") {
            dataUrl = canvas.toDataURL();
            addItem2snapshotList(dataUrl);
            // clearInterval(loop);
            // canvas.style.display = "none";
            // snapshotButton.value = "返回时钟";
        }
        // else {
        // canvas.style.display = "inline";
        // snapshotImageElement.style.display = "none";
        // drawClock(canvas);
        // loop = setInterval(() => { drawClock(canvas) }, 1000);
        // snapshotButton.value = "抓取快照";
        // }
       setTimeout(() => {throttle = true;}, 2000);
    }

});

drawClock(canvas);