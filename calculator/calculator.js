/* calculator.js */
const displayBtn = document.querySelector(".toggle-btn")
const calculator = document.querySelector(".calculator")
let isBright = true
displayBtn.addEventListener("click", function () {
    calculator.classList.toggle("dark")
    isBright = !isBright
})

const displayArea = document.querySelector(".display")
const button = document.querySelectorAll("button")
const textLine = document.querySelector(".text-line")
let textLineOn = true

button.forEach(i => {
    i.addEventListener("click", function () {
        if (i.id === "clear") {
            displayArea.value = ""
        } else if (i.id === "backspaces") {
            displayArea.value = displayArea.value.substring(0, displayArea.value.length - 1)
        } else if (i.id === "equals" && displayArea.value !== "") {
            displayArea.value = eval(displayArea.value)
            if (displayArea.value === "Infinity") {
                displayArea.value = "Zero can't be devided!"
            }
        } else if (i.id === "equals" && displayArea.value === "") {
            displayArea.value = "Empty!"
        }
        else {
            displayArea.value += i.id
        }
    })
})