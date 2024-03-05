let percent = document.querySelector(".percent");
let cnt = 0;
var timeInterval = 100;

function addPercent(){
    percent.innerHTML = cnt + "%";
    cnt ++;
    if(cnt == 101){
        cnt = 0;
    }

    setTimeout(() => {
        timeInterval = Math.round(Math.random() * 200) + 100;

        console.log(timeInterval);

        addPercent();
    }, timeInterval);
}

addPercent();

